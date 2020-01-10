import * as React from "react";
import { Animated, View } from "react-native";
import { CallbackParameter, useScrollPosition } from "./useScrollEvent";

interface DetailScrollableStickyProps {
  parentRef: any;
  isDebug: boolean;
  topOffset: number;
  bottomOffset?: number;
  minHeight: number;
  isUsingTransform: boolean;
  header?: React.ReactElement;
  footer?: React.ReactElement;
  children: React.ReactNode;
  style?: Object;
  bodyStyle?: Object;
}

interface Rectangle {
  height: number;
  top: number;
}

const DetailScrollableSticky = (props: DetailScrollableStickyProps) => {
  const {
    parentRef,
    topOffset,
    bottomOffset,
    minHeight,
    isUsingTransform,
    isDebug,
    header,
    footer,
    children,
    style,
    bodyStyle,
  } = props;

  // type any due to https://stackoverflow.com/questions/51521809/typescript-definitions-for-animated-views-style-prop
  const containerRef = React.useRef<any>(null);
  const bodyRef = React.useRef<any>(null);
  const bodyWrapperRef = React.useRef<any>(null);

  const originalBodyHeight = React.useRef<number>(0);
  const originalBodyWrapperHeight = React.useRef<number>(0);
  const originalContainerHeight = React.useRef<number>(0);
  const maxScrollable = React.useRef<number>(0);
  // Adjustor to let system know
  // that body need to be expanded until meet this adjustor offset.
  const scrollPosition = React.useRef<number>(0);
  const containerRect = React.useRef<Rectangle>({ top: 0, height: 0 });
  const parentRect = React.useRef<Rectangle>({ top: 0, height: 0 });
  // the offset of parent's bottom side
  const parentEndFromTop = React.useRef<number>(0);
  const heightAV = React.useRef<any>(new Animated.Value(-1));
  const topAV = React.useRef<any>(new Animated.Value(-1));

  const setParentInfo = React.useCallback(() => {
    const pHeight = parentRef.current.getBoundingClientRect().height;
    const pTop = parentRef.current.offsetTop;
    parentRect.current = { top: pTop, height: pHeight };
    parentEndFromTop.current =
      parentRect.current.top + parentRect.current.height;
  }, [parentRef, parentRect, parentEndFromTop]);

  React.useEffect(() => {
    setParentInfo();
  }, [parentRect, parentRef, setParentInfo]);

  const setContainerRect = React.useCallback(
    (callback?: Function) => {
      containerRef.current &&
        containerRef.current._component.measure((...args: any) => {
          const wHeight = window ? window.innerHeight : -1;
          const cHeight = args[3];
          const isUseMinHeight = wHeight < 0 || !bottomOffset;
          const tempHeight = isUseMinHeight
            ? minHeight
            : wHeight - topOffset - (bottomOffset ? bottomOffset : 0);
          const finalHeight = tempHeight > cHeight ? cHeight : tempHeight;
          containerRect.current = { top: args[5], height: finalHeight };
          heightAV.current.setValue(finalHeight);
          console.log(cHeight, bottomOffset, tempHeight);
          callback && callback(args);
        });
    },
    [bottomOffset, topOffset, minHeight]
  );

  const setInitialOriginalHeight = React.useCallback((_, svHeight) => {
    originalBodyHeight.current = svHeight;
    bodyWrapperRef.current &&
      bodyWrapperRef.current._component &&
      bodyWrapperRef.current._component.measure((...args: any) => {
        const bwHeight = args[3];
        console.warn(">>>>", svHeight, bwHeight);
        maxScrollable.current = svHeight - bwHeight;
      });
  }, []);

  const setScrollViewHeight = React.useCallback(event => {
    const { height } = event.nativeEvent.layout;
    originalBodyWrapperHeight.current = height;
    maxScrollable.current = originalBodyHeight.current - height;
  }, []);

  const setScrollOnScrolled = React.useCallback(event => {
    scrollPosition.current = event.nativeEvent.contentOffset.y;
  }, []);

  React.useLayoutEffect(() => {
    setContainerRect((args: number[]) => {
      originalContainerHeight.current = args[3];
    });
  }, [setContainerRect]);

  useScrollPosition(
    (pos: CallbackParameter) => {
      const { prevPos, currPos } = pos;
      setParentInfo(); // handling content reflow caused by post-ssr render

      const scrollYRelativeToParent = currPos.y - parentRect.current.top;
      const scrollYWithOffset = scrollYRelativeToParent + topOffset;
      const scrollYPositive = scrollYWithOffset > 0 ? scrollYWithOffset : 0;
      if (scrollYPositive > parentRect.current.height) return;

      const procedure = () => {
        // set Top
        let computedOfset = 0;
        const isContainerReachBottom =
          scrollYPositive + containerRect.current.height >=
          parentRect.current.height;
        if (isContainerReachBottom) {
          computedOfset =
            parentRect.current.height - containerRect.current.height;
        } else {
          computedOfset = scrollYPositive;
        }
        topAV.current.setValue(computedOfset);

        // set scrollTop to bottom of page
        const diff = currPos.y - prevPos.y;
        const spVal = scrollPosition.current + diff;

        const clampedVal =
          spVal >= maxScrollable.current ? maxScrollable.current : spVal;
        scrollPosition.current = spVal < 0 ? 0 : clampedVal;
        bodyRef.current &&
          bodyRef.current._component.scrollTo({
            y: scrollPosition.current,
            animated: false,
          });
      };

      procedure();
    },
    [topAV, maxScrollable],
    parentRef,
    true
  );

  const containerStyle = isUsingTransform
    ? {
        height: heightAV.current,
        transform: [
          {
            translateY: topAV.current,
          },
        ],
      }
    : {
        height: heightAV.current,
        top: topAV.current,
      };

  const staticStyle = {
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
  };

  const containerItemStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  return (
    <>
      <Animated.View
        ref={containerRef}
        style={[
          containerStyle,
          staticStyle,
          isDebug && {
            borderColor: "orange",
            borderWidth: 2,
          },
          style,
        ]}
      >
        <View style={[{ flexGrow: 0, flexShrink: 0, flexBasis: "auto" }]}>
          {header}
        </View>
        <Animated.View
          ref={bodyWrapperRef}
          onLayout={setScrollViewHeight}
          style={[
            containerItemStyle,
            { flexGrow: 1, flexShrink: 1 },
            isDebug && { borderColor: "red", borderWidth: 2 },
          ]}
        >
          <Animated.ScrollView
            onContentSizeChange={(w, h) => {
              console.warn("onContentSizeChange is TRIGGERED!");
              setInitialOriginalHeight(w, h);
            }}
            onScroll={setScrollOnScrolled}
            scrollEventThrottle={16}
            ref={bodyRef}
            style={[
              {
                overflowY: "scroll",
                height: "100%",
              },
              bodyStyle,
            ]}
          >
            {/* https://stackoverflow.com/a/53689186 */}
            <>{children}</>
          </Animated.ScrollView>
        </Animated.View>
        <View style={[{ flexBasis: "auto", flexShrink: 0, flexGrow: 0 }]}>
          {footer}
        </View>
      </Animated.View>
    </>
  );
};

DetailScrollableSticky.defaultProps = {
  isUsingTransform: false,
  isDebug: false,
  topOffset: 0,
  minHeight: 0,
};

export default DetailScrollableSticky;
