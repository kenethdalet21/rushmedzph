package com.epharma.ecosystem.service.doctorapp;

import com.epharma.ecosystem.model.doctorapp.DoctorUser;
import com.epharma.ecosystem.repository.doctorapp.DoctorUserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class DoctorUserServiceTest {
    @Mock
    private DoctorUserRepository doctorUserRepository;

    @InjectMocks
    private DoctorUserService doctorUserService;

    public DoctorUserServiceTest() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAllUsers() {
        when(doctorUserRepository.findAll()).thenReturn(Collections.emptyList());
        List<DoctorUser> users = doctorUserService.getAllUsers();
        assertEquals(0, users.size());
    }
}
