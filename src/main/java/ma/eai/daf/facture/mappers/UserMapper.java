package ma.eai.daf.facture.mappers;

import ma.eai.daf.facture.dto.UserCreateDto;
import ma.eai.daf.facture.dto.UserDto;
import ma.eai.daf.facture.dto.UserUpdateDto;
import ma.eai.daf.facture.entities.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    // ===== ENTITY TO DTO =====

    public UserDto toDto(User user) {
        if (user == null) {
            return null;
        }

        return UserDto.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .role(user.getRole())
                .actif(user.isActif())
                .nomComplet(user.getNomComplet())
                .nbFacturesCreees(user.getNombreFacturesCreees())
                .nbFacturesValideesN1(user.getNombreFacturesValideesN1())
                .nbFacturesValideesN2(user.getNombreFacturesValideesN2())
                .nbFacturesTraitees(user.getNombreFacturesTraitees())
                .build();
    }

    public List<UserDto> toDtoList(List<User> users) {
        if (users == null) {
            return null;
        }
        return users.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ===== CREATE DTO TO ENTITY =====

    public User toEntity(UserCreateDto createDto) {
        if (createDto == null) {
            return null;
        }

        return User.builder()
                .nom(createDto.getNom())
                .prenom(createDto.getPrenom())
                .email(createDto.getEmail())
                .motDePasse(createDto.getMotDePasse()) // Sera encodé dans le service
                .role(createDto.getRole())
                .actif(true) // Par défaut actif lors de la création
                .build();
    }

    // ===== UPDATE DTO TO ENTITY =====

    public void updateEntityFromDto(User user, UserUpdateDto updateDto) {
        if (user == null || updateDto == null) {
            return;
        }

        user.setNom(updateDto.getNom());
        user.setPrenom(updateDto.getPrenom());
        user.setEmail(updateDto.getEmail());
        user.setRole(updateDto.getRole());
        user.setActif(updateDto.isActif());

        // Le mot de passe sera traité séparément dans le service
        if (updateDto.getNouveauMotDePasse() != null && !updateDto.getNouveauMotDePasse().trim().isEmpty()) {
            user.setMotDePasse(updateDto.getNouveauMotDePasse());
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Crée un DTO simplifié pour les listes de sélection
     */
    public UserDto toSelectionDto(User user) {
        if (user == null) {
            return null;
        }

        return UserDto.builder()
                .id(user.getId())
                .nomComplet(user.getNomComplet())
                .email(user.getEmail())
                .role(user.getRole())
                .actif(user.isActif())
                .build();
    }

    public List<UserDto> toSelectionDtoList(List<User> users) {
        if (users == null) {
            return null;
        }
        return users.stream()
                .map(this::toSelectionDto)
                .collect(Collectors.toList());
    }
}