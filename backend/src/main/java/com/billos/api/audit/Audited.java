package com.billos.api.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Records an audit log entry (Reports → Audit Logs) when the annotated method returns successfully and its
 * transaction commits. The entity id is taken from the returned object's {@code getId()} (unwrapping
 * {@code ResponseEntity}), else the first {@code UUID} argument.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {

    /** Entity type shown in the log, e.g. "SalesInvoice". */
    String entity();

    /** What happened, e.g. "CREATE", "ISSUE", "DELETE". */
    String action();
}
