package com.billos.api.exception;

import org.springframework.http.HttpStatus;

/** The caller is authenticated but not allowed to do this (role too low, branch editing parent data). */
public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
