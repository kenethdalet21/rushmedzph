package com.epharma.ecosystem.service.adminapp;

import com.epharma.ecosystem.model.adminapp.AdminUser;
import com.epharma.ecosystem.repository.adminapp.AdminUserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class AdminUserServiceTest {
    @Mock
    private AdminUserRepository adminUserRepository;

    @InjectMocks
    private AdminUserService adminUserService;

    public AdminUserServiceTest() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAllUsers() {
        when(adminUserRepository.findAll()).thenReturn(Collections.emptyList());
        List<AdminUser> users = adminUserService.getAllUsers();
        assertEquals(0, users.size());
    }
}
