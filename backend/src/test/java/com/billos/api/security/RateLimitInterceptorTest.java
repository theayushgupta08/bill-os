package com.billos.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class RateLimitInterceptorTest {

    @Mock
    private RateLimitingService rateLimitingService;

    @InjectMocks
    private RateLimitInterceptor interceptor;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldKeyAnonymousCallersByRemoteAddress_notBySpoofableForwardedHeader() throws Exception {
        Bucket bucket = mock(Bucket.class);
        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(true);
        when(bucket.tryConsumeAndReturnRemaining(1)).thenReturn(probe);
        when(rateLimitingService.resolveBucket(any(), any())).thenReturn(bucket);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/public/check-user-exists");
        request.setRemoteAddr("203.0.113.7");
        request.addHeader("X-Forwarded-For", "6.6.6.6");

        assertThat(interceptor.preHandle(request, new MockHttpServletResponse(), new Object()))
                .isTrue();

        verify(rateLimitingService).resolveBucket(eq("rl:crud:ip:203.0.113.7"), any());
    }
}
