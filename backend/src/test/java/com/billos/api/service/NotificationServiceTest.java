package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.billos.api.entity.Notification;
import com.billos.api.entity.User;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.repository.NotificationRepository;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.UserPrincipal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private final UUID me = UUID.randomUUID();
    private final UUID notificationId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        UserPrincipal principal = new UserPrincipal(me, "me@x.com", null, Collections.emptyList(), true);
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Notification notificationFor(UUID userId) {
        User user = new User();
        user.setId(userId);
        Notification n = new Notification();
        n.setUser(user);
        return n;
    }

    @Test
    void markAsRead_marksOwnNotification() {
        Notification mine = notificationFor(me);
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(mine));

        notificationService.markAsRead(notificationId);

        assertThat(mine.getReadAt()).isNotNull();
        verify(notificationRepository).save(mine);
    }

    @Test
    void markAsRead_refusesSomeoneElsesNotification() {
        Notification theirs = notificationFor(UUID.randomUUID());
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(theirs));

        assertThatThrownBy(() -> notificationService.markAsRead(notificationId))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThat(theirs.getReadAt()).isNull();
        verify(notificationRepository, never()).save(any());
    }
}
