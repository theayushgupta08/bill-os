package com.billos.api.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Value("${resend.api.key:#{environment.RESEND_API_KEY}}")
    private String resendApiKey;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private Resend resend;

    @PostConstruct
    public void init() {
        if (resendApiKey != null && !resendApiKey.isEmpty()) {
            this.resend = new Resend(resendApiKey);
            log.info("Resend Email Service initialized");
        } else {
            log.warn("RESEND_API_KEY is not set. Emails will not be sent.");
        }
    }

    public void sendOrganizationInvitation(String toEmail, String orgName, String role, String token) {
        if (resend == null) {
            log.warn("Cannot send email to {}: Resend client not initialized", toEmail);
            return;
        }

        String inviteUrl = frontendUrl + "/accept-invite?token=" + token;

        String htmlContent = String.format(
                "<div>" + "<h2>You have been invited to join %s on billOS</h2>"
                        + "<p>You've been invited to join <strong>%s</strong> as a <strong>%s</strong>.</p>"
                        + "<p><a href=\"%s\" style=\"display:inline-block;padding:10px 20px;background-color:#000;color:#fff;text-decoration:none;border-radius:5px;\">Accept Invitation</a></p>"
                        + "<p>If you don't have an account yet, you will be asked to create one first.</p>"
                        + "<p>This invitation will expire in 7 days.</p>"
                        + "</div>",
                orgName, orgName, role, inviteUrl);

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("billOS <onboarding@resend.dev>") // Use verified domain in production
                .to(toEmail)
                .subject("Invitation to join " + orgName)
                .html(htmlContent)
                .build();

        try {
            resend.emails().send(params);
            log.info("Invitation email sent successfully to {}", toEmail);
        } catch (ResendException e) {
            log.error("Failed to send invitation email to {}", toEmail, e);
            throw new RuntimeException("Failed to send invitation email", e);
        }
    }
}
