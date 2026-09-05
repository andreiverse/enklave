//go:generate swag init --parseDependency -g main.go -o ./docs

package main

import (
	_ "enklave/m/backend/common"
	"enklave/m/backend/controllers"
	_ "enklave/m/backend/docs"
	"enklave/m/backend/middlewares"
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title                      Enklave API
// @version                    1.0
// @description                Secure self-hosted document archival API
// @host                       localhost:8080
// @BasePath                   /

// @securityDefinitions.apikey BearerAuth
// @in                         header
// @name                       Authorization
// @description                Enter "Bearer " followed by your JWT token.

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

	// Swagger documentation endpoint
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	verifier := controllers.AuthController(r)

	api := r.Group("/api")

	api.Use(middlewares.AuthMiddleware(verifier))

	api.GET("/vault", VaultHandler)

	r.Run(":8080")
}

