# Cloudflare와 AWS 배포 경계

배포 경계는 프론트에 Cloudflare Workers, 보호된 백엔드 origin에 Cloudflare
Access와 Tunnel, 백엔드 컨테이너에 AWS EC2, ECR, CodeDeploy를 사용한다. 공개
트래픽은 Cloudflare로 들어오고, 백엔드 애플리케이션은 일반 EC2 inbound로 직접
노출하지 않는다. 런타임 비밀값은 저장소 밖에 두고, 백엔드 교체는 수동 shell
작업이 아니라 CodeDeploy가 수행한다.
