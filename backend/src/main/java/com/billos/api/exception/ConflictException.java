package com.billos.api.exception;

import org.springframework.http.HttpStatus;

/** The request conflicts with the record's current state (already processed, already taken, last owner). */
public class ConflictException extends ApiException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
