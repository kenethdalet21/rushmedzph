package com.epharma.ecosystem.controller.doctorapp;

import com.epharma.ecosystem.config.TestSecurityConfig;
import com.epharma.ecosystem.security.JwtAuthFilter;
import com.epharma.ecosystem.security.JwtAuthEntryPoint;
import com.epharma.ecosystem.security.JwtUtil;
import com.epharma.ecosystem.security.SecurityConfig;
import com.epharma.ecosystem.service.doctorapp.DoctorUserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Collections;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@WebMvcTest(
    controllers = DoctorUserController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = {SecurityConfig.class, JwtAuthFilter.class, JwtAuthEntryPoint.class}
    )
)
@Import(TestSecurityConfig.class)
public class DoctorUserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DoctorUserService doctorUserService;

    @MockBean
    private JwtUtil jwtUtil;

    @Test
    public void testGetAllUsers() throws Exception {
        Mockito.when(doctorUserService.getAllUsers()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/doctor/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
