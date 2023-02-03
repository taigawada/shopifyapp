import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { css } from '@emotion/react';

export const Accordion = ({
    open,
    arrowPadding,
    onAnimationEnded,
    children,
}: {
    open: boolean;
    arrowPadding?: number;
    onAnimationEnded?: () => void;
    children: ReactNode;
}) => {
    const childElement = useRef<HTMLDivElement>(null);
    const [childHeight, setChildHeight] = useState(0);

    useEffect(() => {
        if (childElement.current) {
            const height =
                childElement.current?.clientHeight + (arrowPadding ? arrowPadding : 0) + 1;
            setChildHeight(height);
        }
    }, [open]);

    const springStyle = useSpring({
        height: open ? `${childHeight + 20}px` : '0px',
        onRest: onAnimationEnded,
    });

    return (
        <animated.div
            css={css({
                width: '100%',
                margin: 'var(--p-space-5) 0',
                overflow: 'hidden',
            })}
            style={springStyle}
        >
            <div ref={childElement}>{children}</div>
        </animated.div>
    );
};
