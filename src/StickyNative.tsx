import * as React from "react";
import { Animated, View, findNodeHandle } from "react-native";
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
  isScrollSync?: boolean;
}

interface Rectangle {
  height: number;
  top: number;
}

interface ComponentMeasurement {
  x: number;
  y: number;
  width: number;
  height: number;
  pageX: number;
  pageY: number;
}

interface EmptyObject {}

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
    isScrollSync
  } = props;

  // type any due to https://stackoverflow.com/questions/51521809/typescript-definitions-for-animated-views-style-prop
  const containerRef = React.useRef<any>(null);
  const bodyRef = React.useRef<any>(null);
  const bodyWrapperRef = React.useRef<any>(null);

  const originalBodyHeight = React.useRef<number>(0);
  const originalBodyWrapperHeight = React.useRef<number>(0);
  const originalContainerHeight = React.useRef<number>(0);
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

  const getComponentMeasurement = React.useCallback(
    async (component, isWeb?): Promise<ComponentMeasurement> => {
      if (isWeb) {
        const dom = findNodeHandle(component); // could lead to performance drop
        if (!dom) throw new Error("the component is not available.");
        const rect = ((dom as unknown) as HTMLElement).getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          pageX: rect.left + (window ? window.scrollX : 0),
          pageY: rect.top + (window ? window.scrollY : 0)
        };
      }
      return await new Promise(resolve =>
        component._component.measure(
          (
            x: number,
            y: number,
            width: number,
            height: number,
            pageX: number,
            pageY: number
          ) => {
            resolve({ x, y, width, height, pageX, pageY });
          }
        )
      );
    },
    []
  );

  const setContainerRect = React.useCallback(
    async (callback?: Function) => {
      const measurement = await getComponentMeasurement(
        containerRef.current,
        true
      );
      const wHeight = window ? window.innerHeight : -1;
      const visibleHeight =
        wHeight - topOffset - (bottomOffset ? bottomOffset : 0);
      const remainingHeight = parentEndFromTop.current - measurement.pageY;
      const finalHeight =
        remainingHeight < visibleHeight ? remainingHeight : visibleHeight;
      containerRect.current = { top: measurement.pageY, height: finalHeight };
      heightAV.current.setValue(finalHeight);
      callback && callback(measurement);
    },
    [bottomOffset, topOffset, getComponentMeasurement, parentEndFromTop]
  );

  const getScrollViewContentHeight = React.useCallback(() => {
    const dom = findNodeHandle(bodyRef.current);
    return bodyRef.current && dom
      ? ((dom as unknown) as HTMLElement).scrollHeight
      : 0;
  }, []);

  const setInitialOriginalHeight = React.useCallback(
    (_, svHeight) => {
      setContainerRect();
      originalBodyHeight.current = svHeight;
    },
    [setContainerRect]
  );

  const setScrollViewHeight = React.useCallback(event => {
    const { height } = event.nativeEvent.layout;
    originalBodyWrapperHeight.current = height;
  }, []);

  const setScrollOnScrolled = React.useCallback(
    event => {
      if (isScrollSync)
        scrollPosition.current = event.nativeEvent.contentOffset.y;
    },
    [isScrollSync]
  );

  const getBodyMeasurement = React.useCallback(async (): Promise<
    Partial<ComponentMeasurement>
  > => {
    if (!bodyWrapperRef.current) return {};
    return await getComponentMeasurement(bodyWrapperRef.current);
  }, [getComponentMeasurement, bodyWrapperRef]);

  React.useLayoutEffect(() => {
    setContainerRect();
    getBodyMeasurement().then(measurement => {
      if (measurement && measurement.height)
        originalBodyWrapperHeight.current = measurement.height;
    });
  }, [getBodyMeasurement, setContainerRect]);

  const getTopOffset = React.useCallback(
    async scrollY => {
      const scrollYRelativeToParent = scrollY - parentRect.current.top;
      const scrollYWithOffset = scrollYRelativeToParent + topOffset;
      const scrollYPositive = scrollYWithOffset > 0 ? scrollYWithOffset : 0;
      // set Top
      let computedOfset = 0;
      const measurement = await getComponentMeasurement(
        containerRef.current,
        true
      );
      const isContainerReachBottom =
        scrollYPositive + measurement.height >= parentRect.current.height;
      if (isContainerReachBottom) {
        computedOfset = parentRect.current.height - measurement.height;
      } else {
        computedOfset = scrollYPositive;
      }
      return computedOfset;
    },
    [getComponentMeasurement, topOffset]
  );

  useScrollPosition(
    (pos: CallbackParameter) => {
      const { prevPos, currPos } = pos;
      setParentInfo(); // handling content reflow caused by post-ssr render

      const procedure = async () => {
        topAV.current.setValue(await getTopOffset(currPos.y));

        // set scrollTop to bottom of page
        if (isScrollSync) {
          const distance = currPos.y - prevPos.y;
          const newScrollPosition = scrollPosition.current + distance;
          const maxScroll =
            getScrollViewContentHeight() - originalBodyWrapperHeight.current;
          const clampedVal =
            newScrollPosition >= maxScroll ? maxScroll : newScrollPosition;

          scrollPosition.current = newScrollPosition < 0 ? 0 : clampedVal;
          bodyRef.current &&
            bodyRef.current._component.scrollTo({
              y: scrollPosition.current,
              animated: false
            });
        }
      };

      procedure();
    },
    [topAV],
    parentRef,
    true
  );

  const containerStyle = isUsingTransform
    ? {
        maxHeight: heightAV.current,
        transform: [
          {
            translateY: topAV.current
          }
        ]
      }
    : {
        maxHeight: heightAV.current,
        top: topAV.current
      };

  const staticStyle = {
    overflow: "auto",
    display: "flex",
    flexDirection: "column"
  };

  const containerItemStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
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
            borderWidth: 2
          },
          style
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
            isDebug && { borderColor: "red", borderWidth: 2 }
          ]}
        >
          <Animated.ScrollView
            onContentSizeChange={setInitialOriginalHeight}
            onScroll={setScrollOnScrolled}
            scrollEventThrottle={16}
            ref={bodyRef}
            style={[
              {
                overflowY: "scroll",
                height: "100%"
              },
              bodyStyle
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
  minHeight: 0
};

export default DetailScrollableSticky;
