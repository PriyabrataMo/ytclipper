package auth

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/smtp"
	"time"

	"github.com/shubhamku044/ytclipper/internal/config"
)

type EmailService struct {
	config *config.EmailConfig
}

func NewEmailService(emailConfig *config.EmailConfig) *EmailService {
	return &EmailService{
		config: emailConfig,
	}
}

func (e *EmailService) GetOTPExpiry() time.Time {
	return time.Now().Add(5 * time.Minute) // OTP valid for 5 minutes
}

func (e *EmailService) GenerateOTP() (string, error) {
	// Generate a 6-digit OTP
	max := big.NewInt(999999)
	min := big.NewInt(100000)

	rangeVal := new(big.Int).Sub(max, min)
	rangeVal.Add(rangeVal, big.NewInt(1))

	randomNum, err := rand.Int(rand.Reader, rangeVal)
	if err != nil {
		return "", err
	}

	otp := new(big.Int).Add(randomNum, min)
	return otp.String(), nil
}

func (e *EmailService) SendOTPEmail(email, otp string) error {
	if e.config.SMTPHost == "" || e.config.SMTPUsername == "" || e.config.SMTPPassword == "" {
		// Fallback to logging if SMTP not configured
		fmt.Printf("OTP email sent to %s with OTP: %s\n", email, otp)
		return nil
	}

	subject := "Email Verification OTP - YT Clipper"
	body := fmt.Sprintf(`
Hello!

Your email verification OTP is: %s

This OTP is valid for 5 minutes.

If you didn't request this verification, please ignore this email.

Best regards,
%s Team
`, otp, e.config.FromName)

	message := fmt.Sprintf("From: %s <%s>\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"\r\n"+
		"%s\r\n", e.config.FromName, e.config.FromEmail, email, subject, body)

	auth := smtp.PlainAuth("", e.config.SMTPUsername, e.config.SMTPPassword, e.config.SMTPHost)

	var err error
	if e.config.UseSSL {
		err = smtp.SendMail(fmt.Sprintf("%s:%d", e.config.SMTPHost, e.config.SMTPPort), auth, e.config.FromEmail, []string{email}, []byte(message))
	} else {
		err = smtp.SendMail(fmt.Sprintf("%s:%d", e.config.SMTPHost, e.config.SMTPPort), auth, e.config.FromEmail, []string{email}, []byte(message))
	}

	if err != nil {
		return fmt.Errorf("failed to send OTP email: %w", err)
	}

	return nil
}
