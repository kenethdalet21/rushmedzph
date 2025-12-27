package com.epharma.ecosystem.service.merchantapp;

import com.epharma.ecosystem.model.merchantapp.MerchantUser;
import com.epharma.ecosystem.repository.merchantapp.MerchantUserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class MerchantUserServiceTest {
    @Mock
    private MerchantUserRepository merchantUserRepository;

    @InjectMocks
    private MerchantUserService merchantUserService;

    public MerchantUserServiceTest() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAllUsers() {
        when(merchantUserRepository.findAll()).thenReturn(Collections.emptyList());
        List<MerchantUser> users = merchantUserService.getAllUsers();
        assertEquals(0, users.size());
    }
}
