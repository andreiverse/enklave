package main

import (
	"enklave/m/backend/controllers"
	"enklave/m/backend/middlewares"
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	r := gin.New()

	r.Use(gin.Logger(), gin.Recovery())

	store := cookie.NewStore([]byte("your-secret-key"))
	r.Use(sessions.Sessions("mysession", store))

	verifier := controllers.AuthController(r)

	api := r.Group("/api")

	api.Use(middlewares.AuthMiddleware(verifier))

	api.GET("/vault", func(c *gin.Context) {
		sub := c.GetString("sub")
		c.JSON(http.StatusOK, gin.H{"message": "Welcome to your secure vault", "sub": sub})
	})

	r.Run(":8080")
}
