package com.billos.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Architecture guard: every endpoint of a tenant-scoped controller must declare its minimum role, and writes
 * must require more than bare membership. Fails the build when a new endpoint forgets {@code @PreAuthorize}.
 */
class ControllerAuthorizationTest {

    /** Controllers that are public or act only on the caller themselves. */
    private static final Set<String> SELF_SERVICE_CONTROLLERS =
            Set.of("HealthController", "PublicController", "UserController");

    /** Endpoints that scope themselves to the caller (own orgs) or check access in the service. */
    private static final Map<String, Set<String>> SELF_SERVICE_METHODS = Map.of(
            "OrganizationController",
            Set.of(
                    "createOrganization",
                    "setupOrganization",
                    "getMyOrganizations",
                    "getOrganizationTree",
                    "getOrganizationById",
                    "createBranch"));

    /** Writes intentionally open to any member: marking your own notification read changes nothing shared. */
    private static final Map<String, Set<String>> MEMBER_WRITES =
            Map.of("NotificationController", Set.of("markAsRead"));

    @Test
    void everyTenantScopedEndpointDeclaresARole() throws Exception {
        List<String> violations = new ArrayList<>();
        for (Class<?> controller : controllers()) {
            if (SELF_SERVICE_CONTROLLERS.contains(controller.getSimpleName())) {
                continue;
            }
            for (Method method : controller.getDeclaredMethods()) {
                if (!isEndpoint(method)
                        || SELF_SERVICE_METHODS
                                .getOrDefault(controller.getSimpleName(), Set.of())
                                .contains(method.getName())) {
                    continue;
                }
                PreAuthorize rule = method.getAnnotation(PreAuthorize.class);
                String where = controller.getSimpleName() + "." + method.getName();
                if (rule == null) {
                    violations.add(where + " has no @PreAuthorize");
                    continue;
                }
                boolean isRead = AnnotatedElementUtils.hasAnnotation(method, GetMapping.class);
                boolean memberOnly = rule.value().contains("isMember()");
                if (!isRead
                        && memberOnly
                        && !MEMBER_WRITES
                                .getOrDefault(controller.getSimpleName(), Set.of())
                                .contains(method.getName())) {
                    violations.add(where + " is a write open to any member (VIEWER)");
                }
                if (AnnotatedElementUtils.hasAnnotation(method, DeleteMapping.class)
                        && (memberOnly || rule.value().contains("'USER'"))) {
                    violations.add(where + " allows deletes below MANAGER");
                }
            }
        }
        assertThat(violations).isEmpty();
    }

    private static boolean isEndpoint(Method method) {
        return AnnotatedElementUtils.hasAnnotation(method, RequestMapping.class);
    }

    private static List<Class<?>> controllers() throws ClassNotFoundException {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));
        List<Class<?>> result = new ArrayList<>();
        for (BeanDefinition bd : scanner.findCandidateComponents("com.billos.api.controller")) {
            result.add(Class.forName(bd.getBeanClassName()));
        }
        assertThat(result).hasSizeGreaterThan(20);
        return result;
    }
}
