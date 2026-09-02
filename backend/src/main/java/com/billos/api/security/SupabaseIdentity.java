package com.billos.api.security;

import java.util.UUID;

/**
 * The subset of a verified Supabase access token that billOS cares about.
 *
 * <p>Produced by {@link JwtTokenProvider#toIdentity} and consumed by
 * {@link com.billos.api.service.SupabaseUserProvisioningService}, so that JWT parsing stays in the
 * security layer and persistence stays in the service layer.
 *
 * @param supabaseId the token {@code sub} claim — the Supabase Auth user id
 * @param email the token {@code email} claim
 * @param firstName resolved from {@code user_metadata}, never null (falls back to the email prefix)
 * @param lastName resolved from {@code user_metadata}, never null (may be empty)
 * @param phone resolved from {@code user_metadata} or the {@code phone} claim, may be null
 */
public record SupabaseIdentity(UUID supabaseId, String email, String firstName, String lastName, String phone) {}
