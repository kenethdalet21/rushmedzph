package com.epharma.ecosystem.controller.merchantapp;

import com.epharma.ecosystem.model.merchantapp.MerchantUser;
import com.epharma.ecosystem.service.merchantapp.MerchantUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/merchant/users")
public class MerchantUserController {
    @Autowired
    private MerchantUserService merchantUserService;

    @GetMapping
    public List<MerchantUser> getAllUsers() {
        return merchantUserService.getAllUsers();
    }

    @GetMapping("/{id}")
    public Optional<MerchantUser> getUserById(@PathVariable Long id) {
        return merchantUserService.getUserById(id);
    }

    @PostMapping
    public MerchantUser createUser(@RequestBody MerchantUser user) {
        return merchantUserService.saveUser(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        merchantUserService.deleteUser(id);
    }
}
