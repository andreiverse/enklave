package controllers

import (
	"context"
	"enklave/m/backend/common"
	"net/http"
	"os"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

// AuthCallbackResponse represents the response upon successful OIDC callback authentication.
type AuthCallbackResponse struct {
	Message string `json:"message" example:"Login successful"`
	Sub     string `json:"sub" example:"auth0|1234567890"`
}

// AuthHandler handles OIDC authentication routes.
type AuthHandler struct {
	oauth2Config oauth2.Config
	verifier     *oidc.IDTokenVerifier
}

// Login godoc
// @Summary      OIDC login
// @Description  Redirects to the OIDC identity provider for authentication
// @Tags         auth
// @Success      302 {string} string "Redirects to OIDC provider auth URL"
// @Router       /auth/login [get]
func (h *AuthHandler) Login(c *gin.Context) {
	// TODO: put this in session
	state := "random-state-string"
	c.Redirect(http.StatusFound, h.oauth2Config.AuthCodeURL(state))
}

// Callback godoc
// @Summary      OIDC callback
// @Description  Handles OIDC authentication callback, verifies token, and creates user session
// @Tags         auth
// @Produce      json
// @Param        state query string true "OAuth2 state parameter"
// @Param        code query string true "OAuth2 authorization code"
// @Success      200 {object} AuthCallbackResponse "Login successful"
// @Failure      400 {object} common.ErrorResponse "Invalid state"
// @Failure      500 {object} common.ErrorResponse "Authentication or token verification error"
// @Router       /auth/callback [get]
func (h *AuthHandler) Callback(c *gin.Context) {
	// TODO: fetch from session and check
	if c.Query("state") != "random-state-string" {
		c.AbortWithStatusJSON(http.StatusBadRequest, common.ErrorResponse{Error: "Invalid state"})
		return
	}

	oauth2Token, err := h.oauth2Config.Exchange(c.Request.Context(), c.Query("code"))
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, common.ErrorResponse{Error: "Failed to exchange token"})
		return
	}

	// Extract the ID Token from OAuth2 token
	rawIDToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		c.AbortWithStatusJSON(http.StatusInternalServerError, common.ErrorResponse{Error: "No id_token field in oauth2 token."})
		return
	}

	// Verify the ID Token
	idToken, err := h.verifier.Verify(c.Request.Context(), rawIDToken)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, common.ErrorResponse{Error: "Failed to verify ID Token"})
		return
	}

	// Extract claims (e.g., subject ID for Postgres mapping)
	var claims struct {
		Subject string `json:"sub"`
	}
	if err := idToken.Claims(&claims); err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, common.ErrorResponse{Error: "Failed to parse claims"})
		return
	}

	session := sessions.Default(c)
	session.Set("sub", claims.Subject)
	session.Save()

	c.JSON(http.StatusOK, AuthCallbackResponse{Message: "Login successful", Sub: claims.Subject})
}

func AuthController(router *gin.Engine) *oidc.IDTokenVerifier {
	ctx := context.Background()
	r := router.Group("auth")

	provider, err := oidc.NewProvider(ctx, os.Getenv("OIDC_PROVIDER"))

	if err != nil {
		panic(err)
	}

	oauth2Config := oauth2.Config{ClientID: os.Getenv("OIDC_CLIENT_ID"), ClientSecret: os.Getenv("OIDC_CLIENT_SECRET"), RedirectURL: "http://localhost:8080/auth/callback", Endpoint: provider.Endpoint(), Scopes: []string{oidc.ScopeOpenID, "profile", "email"}}

	verifier := provider.Verifier(&oidc.Config{ClientID: oauth2Config.ClientID})

	h := &AuthHandler{
		oauth2Config: oauth2Config,
		verifier:     verifier,
	}

	r.GET("/login", h.Login)
	r.GET("/callback", h.Callback)

	return verifier
}
