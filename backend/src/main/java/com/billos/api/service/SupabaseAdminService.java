package com.billos.api.service;

import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Wraps the Supabase Admin (service_role) API for managing auth users server-side.
 *
 * <p>Only used for owner-created staff accounts — normal owner registration goes through the
 * standard Supabase client-side flow.
 */
@Slf4j
@Service
public class SupabaseAdminService {

    private final RestClient restClient;

    public SupabaseAdminService(
            @Value("${app.supabase.url}") String supabaseUrl,
            @Value("${app.supabase.service-role-key}") String serviceRoleKey) {
        this.restClient = RestClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Creates a new user in Supabase Auth with email pre-confirmed.
     *
     * @return the Supabase user ID (UUID)
     */
    @SuppressWarnings("unchecked")
    public UUID createUser(String email, String password, String firstName, String lastName, String phone) {
        Map<String, Object> body = Map.of(
                "email",
                email,
                "password",
                password,
                "email_confirm",
                true,
                "user_metadata",
                Map.of(
                        "first_name", firstName,
                        "last_name", lastName,
                        "phone", phone));

        Map<String, Object> response = restClient
                .post()
                .uri("/auth/v1/admin/users")
                .body(body)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("id")) {
            throw new RuntimeException("Failed to create Supabase user — no 'id' in response");
        }

        UUID supabaseId = UUID.fromString((String) response.get("id"));
        log.info("Created Supabase auth user {} for {}", supabaseId, email);
        return supabaseId;
    }

    /**
     * Updates the password for an existing Supabase Auth user.
     */
    @SuppressWarnings("unchecked")
    public void updatePassword(UUID supabaseId, String newPassword) {
        restClient
                .put()
                .uri("/auth/v1/admin/users/{id}", supabaseId.toString())
                .body(Map.of("password", newPassword))
                .retrieve()
                .body(Map.class);

        log.info("Updated password for Supabase user {}", supabaseId);
    }
}
