package com.billos.api.exception;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.NoSuchElementException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private final MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/customers/1");

    @Test
    void shouldReturn404WithMessage_forResourceNotFound() {
        ResponseEntity<GlobalExceptionHandler.ErrorBody> res =
                handler.handleApi(new ResourceNotFoundException("Customer not found"), request);

        assertThat(res.getStatusCode().value()).isEqualTo(404);
        assertThat(res.getBody().message()).isEqualTo("Customer not found");
        assertThat(res.getBody().path()).isEqualTo("/api/v1/customers/1");
    }

    @Test
    void shouldUseEachApiExceptionsStatus() {
        assertThat(handler.handleApi(new BadRequestException("x"), request)
                        .getStatusCode()
                        .value())
                .isEqualTo(400);
        assertThat(handler.handleApi(new ConflictException("x"), request)
                        .getStatusCode()
                        .value())
                .isEqualTo(409);
        assertThat(handler.handleApi(new ForbiddenException("x"), request)
                        .getStatusCode()
                        .value())
                .isEqualTo(403);
    }

    @Test
    void shouldReturn403_whenRoleCheckDenies() {
        ResponseEntity<GlobalExceptionHandler.ErrorBody> res =
                handler.handleAccessDenied(new AccessDeniedException("Access Denied"), request);

        assertThat(res.getStatusCode().value()).isEqualTo(403);
        assertThat(res.getBody().message()).contains("role");
    }

    @Test
    void shouldHideInternalDetails_forUnexpectedErrors() {
        ResponseEntity<GlobalExceptionHandler.ErrorBody> res = handler.handleUnexpected(
                new RuntimeException("org.postgresql.util.PSQLException: connection refused"), request);

        assertThat(res.getStatusCode().value()).isEqualTo(500);
        assertThat(res.getBody().message()).isEqualTo(GlobalExceptionHandler.GENERIC_ERROR);
    }

    @Test
    void shouldMapEmptyOptionalTo404_andIntegrityViolationTo409() {
        assertThat(handler.handleNoSuchElement(new NoSuchElementException(), request)
                        .getStatusCode()
                        .value())
                .isEqualTo(404);
        assertThat(handler.handleIntegrity(new DataIntegrityViolationException("dup"), request)
                        .getStatusCode()
                        .value())
                .isEqualTo(409);
    }
}
