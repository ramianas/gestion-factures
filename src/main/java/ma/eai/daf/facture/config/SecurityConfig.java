// Fichier: src/main/java/ma/eai/daf/facture/config/SecurityConfig.java

package ma.eai.daf.facture.config;

import ma.eai.daf.facture.security.JwtAuthenticationEntryPoint;
import ma.eai.daf.facture.security.JwtAuthenticationFilter;
import ma.eai.daf.facture.security.JwtTokenProvider;
import ma.eai.daf.facture.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    // ✅ SUPPRIMÉ : PasswordEncoder bean (maintenant dans PasswordEncoderConfig)

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(authz -> authz
                        // ===== ENDPOINTS PUBLICS =====
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ===== ENDPOINTS DE TEST (à supprimer en production) =====
                        .requestMatchers("/api/factures/test/**").permitAll()
                        .requestMatchers("/api/factures/**/test").permitAll()
                        .requestMatchers("/api/factures/**-test").permitAll()

                        // ===== SWAGGER / API DOCS =====
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll()

                        // ===== ENDPOINTS ADMIN UNIQUEMENT =====
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // ===== ENDPOINTS FACTURES =====
                        // Création et modification de factures (U1 uniquement)
                        .requestMatchers(HttpMethod.POST, "/api/factures").hasRole("U1")
                        .requestMatchers(HttpMethod.PUT, "/api/factures/**").hasRole("U1")
                        .requestMatchers(HttpMethod.DELETE, "/api/factures/**").hasRole("U1")
                        .requestMatchers("/api/factures/mes-factures").hasRole("U1")
                        .requestMatchers("/api/factures/**/soumettre-v1").hasRole("U1")

                        // Validation V1 (V1 uniquement)
                        .requestMatchers("/api/factures/en-attente-v1").hasRole("V1")
                        .requestMatchers("/api/factures/**/valider-v1").hasRole("V1")

                        // Validation V2 (V2 uniquement)
                        .requestMatchers("/api/factures/en-attente-v2").hasRole("V2")
                        .requestMatchers("/api/factures/**/valider-v2").hasRole("V2")

                        // Trésorerie (T1 uniquement)
                        .requestMatchers("/api/factures/en-attente-tresorerie").hasRole("T1")
                        .requestMatchers("/api/factures/**/payer").hasRole("T1")

                        // Consultation générale (tous les rôles connectés)
                        .requestMatchers(HttpMethod.GET, "/api/factures/**").hasAnyRole("U1", "V1", "V2", "T1", "ADMIN")
                        .requestMatchers("/api/factures/mes-taches").hasAnyRole("V1", "V2", "T1")
                        .requestMatchers("/api/factures/urgentes").hasAnyRole("V1", "V2", "T1", "ADMIN")
                        .requestMatchers("/api/factures/en-retard").hasAnyRole("T1", "ADMIN")
                        .requestMatchers("/api/factures/tableau-bord").hasAnyRole("U1", "V1", "V2", "T1", "ADMIN")
                        .requestMatchers("/api/factures/donnees-reference").hasAnyRole("U1", "V1", "V2", "T1", "ADMIN")

                        // ===== ENDPOINTS UTILISATEURS =====
                        .requestMatchers(HttpMethod.GET, "/api/users/me").hasAnyRole("U1", "V1", "V2", "T1", "ADMIN")
                        .requestMatchers("/api/users/validateurs-v1").hasAnyRole("U1", "ADMIN")
                        .requestMatchers("/api/users/validateurs-v2").hasAnyRole("U1", "ADMIN")
                        .requestMatchers("/api/users/tresoriers").hasAnyRole("U1", "ADMIN")
                        .requestMatchers("/api/users/search").hasAnyRole("U1", "V1", "V2", "T1", "ADMIN")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        // ===== ENDPOINTS NOTIFICATIONS =====
                        .requestMatchers("/api/notifications/**").hasAnyRole("U1", "V1", "V2", "T1", "ADMIN")

                        // ===== TOUT LE RESTE NÉCESSITE UNE AUTHENTIFICATION =====
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Origines autorisées
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:4200",
                "http://localhost:3000",
                "http://localhost:8080",
                "https://votre-frontend.com"
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}