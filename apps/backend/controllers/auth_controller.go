package controllers

import (
	"context"
	"net/http"
	"os"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

func AuthController(router *gin.Engine) *oidc.IDTokenVerifier {
	ctx := context.Background()
	r := router.Group("auth")

	provider, err := oidc.NewProvider(ctx, os.Getenv("OIDC_PROVIDER"))

	if err != nil {
		panic(err)
	}

	oauth2Config := oauth2.Config{ClientID: os.Getenv("OIDC_CLIENT_ID"), ClientSecret: os.Getenv("OIDC_CLIENT_SECRET"), RedirectURL: "http://localhost:8080/auth/callback", Endpoint: provider.Endpoint(), Scopes: []string{oidc.ScopeOpenID, "profile", "email"}}

	verifier := provider.Verifier(&oidc.Config{ClientID: oauth2Config.ClientID})

	r.GET("/login", func(c *gin.Context) {
		// TODO: put this in session
		state := "random-state-string"
		c.Redirect(http.StatusFound, oauth2Config.AuthCodeURL(state))
	})

	r.GET("/callback", func(c *gin.Context) {
		// TODO: fetch from session and check
		if c.Query("state") != "random-state-string" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid state"})
			return
		}

		oauth2Token, err := oauth2Config.Exchange(c.Request.Context(), c.Query("code"))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token"})
			return
		}

		// Extract the ID Token from OAuth2 token
		rawIDToken, ok := oauth2Token.Extra("id_token").(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "No id_token field in oauth2 token."})
			return
		}

		// Verify the ID Token
		idToken, err := verifier.Verify(c.Request.Context(), rawIDToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify ID Token"})
			return
		}

		// Extract claims (e.g., subject ID for Postgres mapping)
		var claims struct {
			Subject string `json:"sub"`
		}
		if err := idToken.Claims(&claims); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse claims"})
			return
		}

		session := sessions.Default(c)
		session.Set("sub", claims.Subject)
		session.Save()

		c.JSON(http.StatusOK, gin.H{"message": "Login successful", "sub": claims.Subject})
	})

	return verifier
}
