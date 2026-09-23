package com.billos.api.exception;

import org.springframework.http.HttpStatus;

/** The request is invalid or breaks a business rule (bad amounts, missing lines, wrong input). */
public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
