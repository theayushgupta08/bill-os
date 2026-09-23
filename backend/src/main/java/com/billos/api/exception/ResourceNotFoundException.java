package com.billos.api.exception;

import org.springframework.http.HttpStatus;

/** A requested record does not exist (or is not visible to the current organization). */
public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
