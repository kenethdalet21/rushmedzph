package com.epharma.ecosystem.controller.driverapp;

import com.epharma.ecosystem.service.driverapp.DriverUserService;
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

@WebMvcTest(DriverUserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class DriverUserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DriverUserService driverUserService;

    @Test
    public void testGetAllUsers() throws Exception {
        Mockito.when(driverUserService.getAllUsers()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/driver/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
