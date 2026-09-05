# enklave
secure self hosted document archival

## Backend API Documentation

The Go backend uses [swag](https://github.com/swaggo/swag) and [gin-swagger](https://github.com/swaggo/gin-swagger) for OpenAPI (Swagger 2.0) specification generation and interactive UI.

### Prerequisites

Install the `swag` CLI tool:

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

Ensure `$GOPATH/bin` (or `%USERPROFILE%\go\bin` on Windows) is in your `PATH`.

### Generating OpenAPI Specs

From the `apps/backend` directory:

```bash
go generate ./...
```

or directly:

```bash
swag init --parseDependency -g main.go -o ./docs
```

This generates:
- `docs/docs.go`: Embedded Go spec for Gin Swagger middleware
- `docs/swagger.json`: OpenAPI 2.0 specification in JSON format
- `docs/swagger.yaml`: OpenAPI 2.0 specification in YAML format

### Viewing Interactive Documentation

Run the backend server:

```bash
cd apps/backend
go run .
```

Open your browser to:
- **Swagger UI**: [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)
- **Raw OpenAPI JSON Spec**: [http://localhost:8080/swagger/doc.json](http://localhost:8080/swagger/doc.json)