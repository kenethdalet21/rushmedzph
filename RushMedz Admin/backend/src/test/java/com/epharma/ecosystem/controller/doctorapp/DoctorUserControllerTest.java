package com.epharma.ecosystem.controller.doctorapp;

import com.epharma.ecosystem.service.doctorapp.DoctorUserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Collections;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@WebMvcTest(DoctorUserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class DoctorUserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DoctorUserService doctorUserService;

    @Test
    public void testGetAllUsers() throws Exception {
        Mockito.when(doctorUserService.getAllUsers()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/doctor/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
