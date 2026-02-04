{
  description = "ChatShot - WhatsApp conversation screenshot generator CLI";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{ self, flake-parts, nixpkgs, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      flake = {
        # OpenClaw skill module for use in infra
        openclawSkill = { pkgs }:
          let
            chatshot = pkgs.buildNpmPackage {
              pname = "chatshot";
              version = "0.1.0";
              src = self;

              npmDepsHash = "sha256-7E5lPB+XjrcVLusD67JsRQtX4Nqmi+zCMm3/qSgycrE=";

              nativeBuildInputs = [ pkgs.makeWrapper ];
              buildInputs = [ pkgs.chromium ];

              postInstall = ''
                wrapProgram $out/bin/chatshot \
                  --set PUPPETEER_EXECUTABLE_PATH ${pkgs.chromium}/bin/chromium \
                  --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
              '';

              meta = with pkgs.lib; {
                description = "Generate realistic WhatsApp conversation screenshots";
                license = licenses.mit;
                mainProgram = "chatshot";
              };
            };

            skillFile = pkgs.writeText "SKILL.md" (builtins.readFile ./SKILL.md);
          in
          {
            name = "chatshot";
            description = "Generate realistic WhatsApp conversation screenshots for sales demos";
            packages = [ chatshot ];
            skill = skillFile;
          };
      };

      perSystem = { config, pkgs, system, ... }:
        let
          nodejs = pkgs.nodejs_22;

          chatshot = pkgs.buildNpmPackage {
            pname = "chatshot";
            version = "0.1.0";
            src = ./.;

            npmDepsHash = "sha256-7E5lPB+XjrcVLusD67JsRQtX4Nqmi+zCMm3/qSgycrE=";

            nativeBuildInputs = [ pkgs.makeWrapper ];
            buildInputs = [ pkgs.chromium ];

            postInstall = ''
              wrapProgram $out/bin/chatshot \
                --set PUPPETEER_EXECUTABLE_PATH ${pkgs.chromium}/bin/chromium \
                --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
            '';

            meta = with pkgs.lib; {
              description = "Generate realistic WhatsApp conversation screenshots";
              license = licenses.mit;
              mainProgram = "chatshot";
            };
          };
        in
        {
          packages = {
            default = chatshot;
            chatshot = chatshot;
          };

          devShells.default = pkgs.mkShell {
            buildInputs = [
              nodejs
              pkgs.chromium
            ];

            shellHook = ''
              export PUPPETEER_EXECUTABLE_PATH="${pkgs.chromium}/bin/chromium"
              export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
              echo "ChatShot dev shell"
              echo "Chromium: $PUPPETEER_EXECUTABLE_PATH"
            '';
          };

          apps.default = {
            type = "app";
            program = "${chatshot}/bin/chatshot";
          };
        };
    };
}
