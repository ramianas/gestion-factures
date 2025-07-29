package ma.eai.daf.facture;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing

public class FactureApplication {

	public static void main(String[] args) {
		SpringApplication.run(FactureApplication.class, args);
	}

}
