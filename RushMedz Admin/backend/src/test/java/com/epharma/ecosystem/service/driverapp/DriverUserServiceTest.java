package com.epharma.ecosystem.service.driverapp;

import com.epharma.ecosystem.model.driverapp.DriverUser;
import com.epharma.ecosystem.repository.driverapp.DriverUserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class DriverUserServiceTest {
    @Mock
    private DriverUserRepository driverUserRepository;

    @InjectMocks
    private DriverUserService driverUserService;

    public DriverUserServiceTest() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAllUsers() {
        when(driverUserRepository.findAll()).thenReturn(Collections.emptyList());
        List<DriverUser> users = driverUserService.getAllUsers();
        assertEquals(0, users.size());
    }
}
