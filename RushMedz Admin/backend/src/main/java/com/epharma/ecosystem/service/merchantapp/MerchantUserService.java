package com.epharma.ecosystem.service.merchantapp;

import com.epharma.ecosystem.model.merchantapp.MerchantUser;
import com.epharma.ecosystem.repository.merchantapp.MerchantUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class MerchantUserService {
    @Autowired
    private MerchantUserRepository merchantUserRepository;

    public List<MerchantUser> getAllUsers() {
        return merchantUserRepository.findAll();
    }

    public Optional<MerchantUser> getUserById(Long id) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        return merchantUserRepository.findById(id);
    }

    public MerchantUser saveUser(MerchantUser user) {
        if (user == null) throw new IllegalArgumentException("user cannot be null");
        return merchantUserRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        merchantUserRepository.deleteById(id);
    }

    public MerchantUser findByUsername(String username) {
        return merchantUserRepository.findByUsername(username);
    }
}
