package com.epharma.ecosystem.controller.userapp;

import com.epharma.ecosystem.service.userapp.UserUserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.epharma.ecosystem.security.JwtUtil;
import java.util.Collections;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@WebMvcTest(UserUserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UserUserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserUserService userUserService;

    @MockBean
    private JwtUtil jwtUtil;

    @Test
    public void testGetAllUsers() throws Exception {
        Mockito.when(userUserService.getAllUsers()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/user/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
