package com.billos.api.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Maps exceptions to consistent JSON errors: {@code {status, error, message, path, timestamp, fieldErrors?}}.
 * The frontend shows {@code message} directly, so only {@link ApiException}s and well-understood framework
 * errors expose their text; everything else becomes a generic 500 and is logged with its stack trace.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    static final String GENERIC_ERROR = "Something went wrong on our side. Please try again.";

    public record ErrorBody(
            int status,
            String error,
            String message,
            String path,
            OffsetDateTime timestamp,
            Map<String, String> fieldErrors) {}

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorBody> handleApi(ApiException ex, HttpServletRequest request) {
        return build(ex.getStatus(), ex.getMessage(), request, null);
    }

    /** Thrown by {@code @PreAuthorize} when the caller's role is too low. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorBody> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Your role in this organization does not allow this action.", request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorBody> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        String message = fieldErrors.isEmpty()
                ? "Validation failed"
                : fieldErrors.entrySet().stream()
                        .map(e -> e.getKey() + ": " + e.getValue())
                        .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, message, request, fieldErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorBody> handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Malformed request body", request, null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorBody> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Invalid value for '" + ex.getName() + "'", request, null);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorBody> handleMissingParam(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        return build(
                HttpStatus.BAD_REQUEST, "Missing required parameter '" + ex.getParameterName() + "'", request, null);
    }

    /** {@code Optional.orElseThrow()} without a supplier. */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorBody> handleNoSuchElement(NoSuchElementException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "Record not found", request, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorBody> handleIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn(
                "Data integrity violation on {}: {}",
                request.getRequestURI(),
                ex.getMostSpecificCause().getMessage());
        return build(
                HttpStatus.CONFLICT,
                "This change conflicts with existing data (a duplicate, or a record that is still in use).",
                request,
                null);
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ErrorBody> handleOptimisticLock(
            OptimisticLockingFailureException ex, HttpServletRequest request) {
        return build(
                HttpStatus.CONFLICT, "This record was changed by someone else. Reload and try again.", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorBody> handleUnexpected(Exception ex, HttpServletRequest request) {
        // Spring MVC's own exceptions (404 no handler, 405 method not allowed, 415, ...) carry their status
        if (ex instanceof ErrorResponse errorResponse) {
            HttpStatusCode status = errorResponse.getStatusCode();
            String detail = errorResponse.getBody().getDetail();
            return build(HttpStatus.valueOf(status.value()), detail != null ? detail : ex.getMessage(), request, null);
        }
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, GENERIC_ERROR, request, null);
    }

    private ResponseEntity<ErrorBody> build(
            HttpStatus status, String message, HttpServletRequest request, Map<String, String> fieldErrors) {
        return ResponseEntity.status(status)
                .body(new ErrorBody(
                        status.value(),
                        status.getReasonPhrase(),
                        message,
                        request.getRequestURI(),
                        OffsetDateTime.now(),
                        fieldErrors));
    }
}
