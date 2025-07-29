package ma.eai.daf.facture.entities;

import ma.eai.daf.facture.enums.RoleType;
import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "daf_role")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ide_role")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "lib_role", nullable = false, unique = true)
    private RoleType nomRole;

}