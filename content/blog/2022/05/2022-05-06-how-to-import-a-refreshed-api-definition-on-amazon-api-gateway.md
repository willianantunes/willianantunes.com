---
id: 2eeb8890-cd48-11ec-97c9-2f14945d9ce9
title: How to import a refreshed API definition on Amazon API Gateway
date: 2022-05-06T14:34:14.271Z
cover: /assets/posts/blog-23-how-to-import-a-refreshed-api-definition-on-amazon-api-gateway.png
description: Struggling with manual configuration through the web console? Use
  the AWS CLI to update your API definitions on Amazon API Gateway.
tags:
  - openapi
  - apigateway
---
**Warning:** This is a note, so don't expect much 😅!

Suppose your *REST API ID* is `xyz-acme`, and you are only concerned about OpenAPI 3. It's recommended to export the existing API definition before importing a new configuration on Amazon API Gateway. If you don't have any existing API definition, I recommend creating some samples so you don't struggle with the contract you should follow. So, first, export your existing API definition:

```shell
aws apigateway get-export --parameters extensions='apigateway' \
--rest-api-id xyz-acme \
--accepts 'application/yaml' \
--stage-name prd \
--export-type oas30 stage_prd-extensions_apigateway-jafar_api_definition.yaml
```

As an example, you'd have the following:

```yaml
openapi: "3.0.1"
info:
  title: "Agrabah"
  description: "Ah, salaam, and good evening to you!"
  version: "2020-05-06T07:30:01Z"
servers:
  - url: "https://xyz-acme.execute-api.us-east-1.amazonaws.com/{basePath}"
    variables:
      basePath:
        default: "/prd"
paths:
  /v1/cockatiel/{user_id}/orders:
    post:
      parameters:
      - name: "user_id"
        in: "path"
        required: true
        schema:
          type: "string"
      responses:
        "410":
          description: "410 response"
          content: {}
      x-amazon-apigateway-integration:
        responses:
          default:
            statusCode: "410"
            responseTemplates:
              application/json: "{\n    \"message\": \"This endpoint hostname has\
                \ changed.\"\n}"
        requestTemplates:
          application/json: "{\"statusCode\": 200}"
        passthroughBehavior: "when_no_match"
        type: "mock"
  /fluentd:
    post:
      responses:
        "200":
          description: "200 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Empty"
      x-amazon-apigateway-integration:
        connectionId: "${stageVariables.vpcLinkId}"
        httpMethod: "POST"
        uri: "https://fluentd${stageVariables.env_url}willianantunes.com/app.log"
        responses:
          default:
            statusCode: "200"
        passthroughBehavior: "when_no_match"
        connectionType: "VPC_LINK"
        type: "http_proxy"
components:
  schemas:
    Empty:
      title: "Empty Schema"
      type: "object"
```

You can remove some entries and leave just the endpoints you want to add. For example, let's say this YAML:

```yaml
openapi: "3.0.1"
paths:
  /v1/users:
    get:
      parameters:
      - name: "Authorization"
        in: "header"
        required: true
        schema:
          type: "string"
      responses:
        "200":
          description: "200 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserAttributes"
        "400":
          description: "400 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "401":
          description: "401 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "500":
          description: "500 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "403":
          description: "403 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
      x-amazon-apigateway-integration:
        connectionId: "${stageVariables.vpcLinkId}"
        httpMethod: "GET"
        uri: "https://agrabah${stageVariables.env_url}willianantunes.com.br/api/v1/users"
        responses:
          default:
            statusCode: "200"
        requestParameters:
          integration.request.header.Authorization: "method.request.header.Authorization"
        passthroughBehavior: "when_no_match"
        connectionType: "VPC_LINK"
        type: "http_proxy"
    patch:
      parameters:
      - name: "Authorization"
        in: "header"
        required: true
        schema:
          type: "string"
      responses:
        "200":
          description: "200 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserAttributes"
        "400":
          description: "400 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "401":
          description: "401 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "500":
          description: "500 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "403":
          description: "403 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
      x-amazon-apigateway-integration:
        connectionId: "${stageVariables.vpcLinkId}"
        httpMethod: "PATCH"
        uri: "https://agrabah${stageVariables.env_url}willianantunes.com/api/v1/users"
        responses:
          default:
            statusCode: "200"
        requestParameters:
          integration.request.header.Authorization: "method.request.header.Authorization"
        passthroughBehavior: "when_no_match"
        connectionType: "VPC_LINK"
        type: "http_proxy"
  /v1/management/users/{user_id}:
    get:
      parameters:
      - name: "user_id"
        in: "path"
        required: true
        schema:
          type: "string"
      - name: "Authorization"
        in: "header"
        required: true
        schema:
          type: "string"
      responses:
        "200":
          description: "200 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserAttributes"
        "400":
          description: "400 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "401":
          description: "401 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "500":
          description: "500 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "403":
          description: "403 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
      x-amazon-apigateway-integration:
        connectionId: "${stageVariables.vpcLinkId}"
        httpMethod: "GET"
        uri: "https://agrabah${stageVariables.env_url}willianantunes.com/api/v1/management/users/{user_id}"
        responses:
          default:
            statusCode: "200"
        requestParameters:
          integration.request.header.Authorization: "method.request.header.Authorization"
          integration.request.path.user_id: "method.request.path.user_id"
        passthroughBehavior: "when_no_match"
        connectionType: "VPC_LINK"
        type: "http_proxy"
    patch:
      parameters:
      - name: "user_id"
        in: "path"
        required: true
        schema:
          type: "string"
      - name: "Authorization"
        in: "header"
        required: true
        schema:
          type: "string"
      responses:
        "200":
          description: "200 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserAttributes"
        "400":
          description: "400 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "401":
          description: "401 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "500":
          description: "500 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
        "403":
          description: "403 response"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GlobalError"
      x-amazon-apigateway-integration:
        connectionId: "${stageVariables.vpcLinkId}"
        httpMethod: "PATCH"
        uri: "https://agrabah{stageVariables.env_url}willianantunes.com/api/v1/management/users/{user_id}"
        responses:
          default:
            statusCode: "200"
        requestParameters:
          integration.request.header.Authorization: "method.request.header.Authorization"
          integration.request.path.user_id: "method.request.path.user_id"
        passthroughBehavior: "when_no_match"
        connectionType: "VPC_LINK"
        type: "http_proxy"
components:
  schemas:
    GlobalError:
      required:
      - "error"
      - "status_code"
      - "type"
      type: "object"
      properties:
        error:
          $ref: "#/components/schemas/ErrorDetails"
        status_code:
          type: "integer"
          format: "int32"
        type:
          type: "string"
    UserMetadata:
      type: "object"
      properties:
        birthday:
          type: "string"
          format: "date"
        gender:
          maxLength: 35
          type: "string"
        name:
          maxLength: 70
          type: "string"
        given_name:
          maxLength: 35
          type: "string"
        family_name:
          maxLength: 35
          type: "string"
        addresses:
          type: "array"
          items:
            $ref: "#/components/schemas/UserMetadataAddress"
    UserMetadataAddress:
      required:
      - "city"
      - "country"
      - "houseNumberOrName"
      - "identification"
      - "postalCode"
      - "stateOrProvince"
      - "street"
      type: "object"
      properties:
        identification:
          maxLength: 128
          type: "string"
        country:
          maxLength: 2
          minLength: 2
          type: "string"
        stateOrProvince:
          maxLength: 2
          minLength: 2
          type: "string"
        city:
          maxLength: 32
          type: "string"
        houseNumberOrName:
          maxLength: 64
          type: "string"
        street:
          maxLength: 64
          type: "string"
        postalCode:
          maxLength: 8
          type: "string"
    ErrorDetails:
      required:
      - "requestId"
      type: "object"
      properties:
        field_related_errors:
          type: "object"
          additionalProperties:
            type: "object"
        requestId:
          type: "string"
          format: "uuid"
        msg:
          type: "string"
    UserAttributes:
      type: "object"
      properties:
        user_metadata:
          $ref: "#/components/schemas/UserMetadata"
```

To import it using the [merge mode](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-import-api-update.html):

```shell
aws apigateway put-rest-api \
--rest-api-id xyz-acme \
--mode merge \
--fail-on-warnings \
--cli-binary-format raw-in-base64-out \
--body file:///home/aladdin/Development/tmp/refreshed.yaml
```

You can add the flag `--fail-on-warnings` to understand what you can do to enrich your new configuration. Then, after the merge completes, you have a new definition that you can apply to a stage. Use the following command to do so:

```shell
aws apigateway create-deployment \
--rest-api-id xyz-acme \
--stage-name prd \
--description "chore(users): add new routes"
```

If you need a rollback, you should identify which deployment your stage was pointing to. To list all deployments:

```shell
aws apigateway get-deployments \
--rest-api-id xyz-acme
```

Pick the relevant ID for you; let's suppose the ID `QWERTY`, and then you can roll back to it:

```shell
aws apigateway update-stage \
--rest-api-id xyz-acme \
--stage-name prd \
--patch-operations "op=replace,path=/deploymentId,value=QWERTY"
```

You can also delete a deployment if it's not been used. For example, you can delete the deployment with ID `YTREWQ` issuing:

```shell
aws apigateway delete-deployment \
--rest-api-id xyz-acme \
--deployment-id YTREWQ
```

I hope this may help you. See you 😄!
