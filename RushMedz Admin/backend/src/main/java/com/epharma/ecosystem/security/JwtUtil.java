package com.epharma.ecosystem.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${security.jwt.secret}")
    private String secret;

    @Value("${security.jwt.issuer}")
    private String issuer;

    @Value("${security.jwt.expirationMinutes}")
    private long expirationMinutes;

    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String subject, Map<String, Object> claims) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(subject)
                .setIssuer(issuer)
                .addClaims(claims)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMinutes * 60_000))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parseToken(String token) throws JwtException {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token);
    }
    // Extract username (subject) from JWT
    public String extractUsername(String token) {
        try {
            return parseToken(token).getBody().getSubject();
        } catch (JwtException e) {
            return null;
        }
    }

    // Validate token (checks signature and expiration)
    public boolean validateToken(String token, String username) {
        try {
            Jws<Claims> claimsJws = parseToken(token);
            String subject = claimsJws.getBody().getSubject();
            Date expiration = claimsJws.getBody().getExpiration();
            return (subject != null && subject.equals(username) && expiration.after(new Date()));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
