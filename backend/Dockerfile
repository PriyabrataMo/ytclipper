# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./

RUN go mod download

COPY ./cmd ./cmd
COPY ./internal ./internal


RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/main.go

FROM alpine:3.22

RUN apk --no-cache add ca-certificates

RUN adduser -D -s /bin/sh appuser
WORKDIR /app

COPY --from=builder /app/main .

RUN chown appuser:appuser /app/main

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./main"] 