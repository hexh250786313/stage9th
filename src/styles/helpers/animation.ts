import { styled } from './styled';

export const fadeInUp = styled.keyframes`
    from {
        opacity: 0;
        translate: 0 10px;
    }
    to {
        opacity: 1;
        translate: 0 0;
    }
`;

export const fadeIn = styled.keyframes`
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;
