package com.billos.api.exception;

import org.springframework.http.HttpStatus;

/**
 * Base for errors whose message is safe to show the user. {@link GlobalExceptionHandler} returns the message with
 * {@link #getStatus()}; anything that is not an ApiException is treated as an internal error (500, generic message).
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;

    protected ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
