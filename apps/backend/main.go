//go:generate go run github.com/swaggo/swag/cmd/swag@latest init --parseDependency -g main.go -o ./docs

package main

import (
	_ "embed"
	_ "enklave/m/backend/common"
	"enklave/m/backend/controllers"
	"enklave/m/backend/middlewares"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// @title                      Enklave API
// @version                    1.0
// @description                Secure self-hosted document archival API
// @BasePath                   /

// @securityDefinitions.apikey BearerAuth
// @in                         header
// @name                       Authorization
// @description                Enter "Bearer " followed by your JWT token.

//go:embed docs/swagger.json
var swaggerSpec []byte

// VaultResponse represents the response payload for vault access.
type VaultResponse struct {
	Message string `json:"message" example:"Welcome to your secure vault"`
	Sub     string `json:"sub" example:"auth0|1234567890"`
}

// VaultHandler godoc
// @Summary      Access secure vault
// @Description  Returns secure vault message and subject identity for authenticated user
// @Tags         vault
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} VaultResponse
// @Failure      401 {object} common.ErrorResponse "Unauthorized"
// @Router       /api/vault [get]
func VaultHandler(c *gin.Context) {
	sub := c.GetString("sub")
	c.JSON(http.StatusOK, VaultResponse{
		Message: "Welcome to your secure vault",
		Sub:     sub,
	})
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	store := cookie.NewStore([]byte("your-secret-key"))
	r.Use(sessions.Sessions("mysession", store))

	// Auth routes (browser-only OAuth flow)
	verifier := controllers.AuthController(r)

	// Serve the OpenAPI spec for clients
	r.GET("/docs/openapi.json", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/json", swaggerSpec)
	})

	// Protected API routes
	api := r.Group("/api")
	api.Use(middlewares.AuthMiddleware(verifier))

	api.GET("/vault", VaultHandler)

	if gin.Mode() == "debug" {
		// Serve frontend in dev
		frontendURL, _ := url.Parse("http://localhost:3000")
		proxy := httputil.NewSingleHostReverseProxy(frontendURL)

		r.NoRoute(func(ctx *gin.Context) {
			proxy.ServeHTTP(ctx.Writer, ctx.Request)
		})
	}

	r.Run(":8080")
}
