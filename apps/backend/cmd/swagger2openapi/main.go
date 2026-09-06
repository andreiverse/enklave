// Command swagger2openapi converts a Swagger 2.0 JSON file to OpenAPI 3.0.
//
// Usage:
//
//	go run ./cmd/swagger2openapi -input docs/swagger.json -output docs/openapi.json
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/getkin/kin-openapi/openapi2"
	"github.com/getkin/kin-openapi/openapi2conv"
)

func main() {
	input := flag.String("input", "docs/swagger.json", "path to Swagger 2.0 JSON file")
	output := flag.String("output", "docs/openapi.json", "path to write OpenAPI 3.0 JSON file")
	flag.Parse()

	data, err := os.ReadFile(*input)
	if err != nil {
		log.Fatalf("reading input: %v", err)
	}

	var swagger2 openapi2.T
	if err := json.Unmarshal(data, &swagger2); err != nil {
		log.Fatalf("parsing Swagger 2.0: %v", err)
	}

	openapi3, err := openapi2conv.ToV3(&swagger2)
	if err != nil {
		log.Fatalf("converting to OpenAPI 3.0: %v", err)
	}

	out, err := json.MarshalIndent(openapi3, "", "    ")
	if err != nil {
		log.Fatalf("marshalling OpenAPI 3.0: %v", err)
	}

	if err := os.WriteFile(*output, append(out, '\n'), 0644); err != nil {
		log.Fatalf("writing output: %v", err)
	}

	fmt.Printf("Converted %s → %s (OpenAPI 3.0)\n", *input, *output)
}
