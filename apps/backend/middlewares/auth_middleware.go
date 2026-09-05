package middlewares

import (
	"net/http"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(verifier *oidc.IDTokenVerifier) func(*gin.Context) {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		subSession := session.Get("sub")

		if subSession != nil {
			c.Set("sub", subSession)
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing cookie or invalid token"})
			return
		}

		rawToken := strings.TrimPrefix(authHeader, "Bearer ")
		idToken, err := verifier.Verify(c.Request.Context(), rawToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		c.Set("sub", idToken.Subject)
		c.Next()
	}
}
