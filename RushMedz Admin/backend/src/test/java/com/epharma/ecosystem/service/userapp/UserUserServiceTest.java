package com.epharma.ecosystem.service.userapp;

import com.epharma.ecosystem.model.userapp.UserUser;
import com.epharma.ecosystem.repository.userapp.UserUserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class UserUserServiceTest {
    @Mock
    private UserUserRepository userUserRepository;

    @InjectMocks
    private UserUserService userUserService;

    public UserUserServiceTest() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAllUsers() {
        when(userUserRepository.findAll()).thenReturn(Collections.emptyList());
        List<UserUser> users = userUserService.getAllUsers();
        assertEquals(0, users.size());
    }
}
