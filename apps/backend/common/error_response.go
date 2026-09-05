package common

// ErrorResponse represents a standard error response.
type ErrorResponse struct {
	Error string `json:"error" example:"Invalid state"`
}

// NewErrorResponse creates a new ErrorResponse.
func NewErrorResponse(err string) ErrorResponse {
	return ErrorResponse{Error: err}
}
