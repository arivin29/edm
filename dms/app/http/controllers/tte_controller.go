package controllers

import (
	nethttp "net/http"

	"github.com/goravel/framework/contracts/http"

	"dms/app/services"
	"dms/app/types"
)

type TTEController struct {
	tteService *services.TTEService
}

func NewTTEController() *TTEController {
	return &TTEController{
		tteService: services.NewTTEService(),
	}
}

// POST /documents/{id}/sign — Sign a document
func (c *TTEController) Sign(ctx http.Context) http.Response {
	documentID := ctx.Request().Route("id")
	if documentID == "" {
		return ctx.Response().Status(nethttp.StatusBadRequest).Json(http.Json{"error": "Document ID is required"})
	}

	// Get current user from auth context
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return ctx.Response().Status(nethttp.StatusUnauthorized).Json(http.Json{"error": "Unauthorized"})
	}

	sig, err := c.tteService.SignDocument(services.SignRequest{
		DocumentID: documentID,
		SignerID:   user.ID,
		IPAddress:  ctx.Request().Ip(),
	})
	if err != nil {
		return ctx.Response().Status(nethttp.StatusBadRequest).Json(http.Json{"error": err.Error()})
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    sig,
		"message": "Dokumen berhasil ditandatangani",
	})
}

// GET /documents/{id}/signatures — List document signatures
func (c *TTEController) ListSignatures(ctx http.Context) http.Response {
	documentID := ctx.Request().Route("id")
	if documentID == "" {
		return ctx.Response().Status(nethttp.StatusBadRequest).Json(http.Json{"error": "Document ID is required"})
	}

	signatures, err := c.tteService.ListSignatures(documentID)
	if err != nil {
		return ctx.Response().Status(nethttp.StatusInternalServerError).Json(http.Json{"error": err.Error()})
	}

	return ctx.Response().Success().Json(http.Json{
		"data": signatures,
	})
}

// POST /signatures/{id}/verify — Verify a signature
func (c *TTEController) Verify(ctx http.Context) http.Response {
	signatureID := ctx.Request().Route("id")
	if signatureID == "" {
		return ctx.Response().Status(nethttp.StatusBadRequest).Json(http.Json{"error": "Signature ID is required"})
	}

	sig, valid, err := c.tteService.VerifySignature(signatureID)
	if err != nil {
		return ctx.Response().Status(nethttp.StatusBadRequest).Json(http.Json{
			"error": err.Error(),
			"data":  sig,
			"valid": false,
		})
	}

	message := "Tanda tangan valid — dokumen tidak berubah sejak ditandatangani"
	if !valid {
		message = "Tanda tangan TIDAK valid — dokumen telah dimodifikasi setelah ditandatangani"
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    sig,
		"valid":   valid,
		"message": message,
	})
}

// POST /signatures/{id}/revoke — Revoke a signature
func (c *TTEController) Revoke(ctx http.Context) http.Response {
	signatureID := ctx.Request().Route("id")
	reason := ctx.Request().Input("reason", "Dicabut oleh pengguna")

	if err := c.tteService.RevokeSignature(signatureID, reason); err != nil {
		return ctx.Response().Status(nethttp.StatusBadRequest).Json(http.Json{"error": err.Error()})
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Tanda tangan berhasil dicabut",
	})
}

// GET /tte/config — Get TTE provider configuration
func (c *TTEController) GetConfig(ctx http.Context) http.Response {
	config, err := c.tteService.GetTTEConfig()
	if err != nil {
		return ctx.Response().Status(nethttp.StatusInternalServerError).Json(http.Json{"error": err.Error()})
	}

	return ctx.Response().Success().Json(http.Json{
		"data": config,
	})
}
