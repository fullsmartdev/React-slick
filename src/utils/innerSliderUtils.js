import React from 'react'
import ReactDOM from 'react-dom'
import { getTrackLeft, getTrackCSS, getTrackAnimateCSS } from '../mixins/trackHelper.js'
// return list of slides that need to be loaded and are not in lazyLoadedList
export const getOnDemandLazySlides = spec => {
  let onDemandSlides = []
  let startIndex = lazyStartIndex(spec)
  let endIndex = lazyEndIndex(spec)
  for (let slideIndex = startIndex; slideIndex < endIndex; slideIndex++) {
    if (spec.lazyLoadedList.indexOf(slideIndex) < 0) {
      onDemandSlides.push(slideIndex)
    }
  }
  return onDemandSlides
}

// return list of slides that need to be present
export const getRequiredLazySlides = spec => {
  let requiredSlides = []
  let startIndex = lazyStartIndex(spec)
  let endIndex = lazyEndIndex(spec)
  for (let slideIndex = startIndex; slideIndex < endIndex; slideIndex++) {
    requiredSlides.push(slideIndex)
  }
  return requiredSlides

}

// startIndex that needs to be present
export const lazyStartIndex = spec => spec.currentSlide - slidesOnLeft(spec)
// endIndex that needs to be present but is exclusive
export const lazyEndIndex = spec => spec.currentSlide + slidesOnRight(spec)

// no of slides on left of current in active frame
export const slidesOnLeft = spec => (
  spec.centerMode
    ? Math.floor(spec.slidesToShow / 2) + (parseInt(spec.centerPadding) > 0 ? 1 : 0) 
    : 0
)

// no of slides on right of current in active frame
export const slidesOnRight = spec => (
  spec.centerMode
  ? Math.floor((spec.slidesToShow - 1) / 2) + 1 + (parseInt(spec.centerPadding) > 0 ? 1 : 0)
  : spec.slidesToShow
)

// get width of an element
export const getWidth = elem => elem && elem.offsetWidth || 0

// get height of an element
export const getHeight = elem => elem && elem.offsetHeight || 0

// in case of swipe event, get direction of the swipe event
export const getSwipeDirection = (touchObject, verticalSwiping=false) => {
  var xDist, yDist, r, swipeAngle;
  xDist = touchObject.startX - touchObject.curX;
  yDist = touchObject.startY - touchObject.curY;
  r = Math.atan2(yDist, xDist);
  swipeAngle = Math.round(r * 180 / Math.PI);
  if (swipeAngle < 0) {
      swipeAngle = 360 - Math.abs(swipeAngle);
  }
  if ((swipeAngle <= 45) && (swipeAngle >= 0) || (swipeAngle <= 360) && (swipeAngle >= 315)) {
      return 'left';
  }
  if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
      return 'right';
  }
  if (verticalSwiping === true) {
    if ((swipeAngle >= 35) && (swipeAngle <= 135)) {
      return 'up';
    } else {
      return 'down';
    }
  }

  return 'vertical';

}

// whether or not we can go next
export const canGoNext = spec => {
  let canGo = true
  if (!spec.infinite) {
    if (spec.centerMode && spec.currentSlide >= spec.slideCount - 1) {
      canGo = false
    } else if (spec.slideCount <= spec.slidesToShow ||
      spec.currentSlide >= spec.slideCount - spec.slidesToShow) {
      canGo = false
    }
  }
  return canGo
}

// given an object and a list of keys, return new object with given keys
export const extractObject = (spec, keys) => {
  let newObject = {}
  keys.forEach( key => newObject[key] = spec[key])
  return newObject
}

// get initialized state
export const initializedState = spec => {
  // spec also contains listRef, trackRef
  let slideCount = React.Children.count(spec.children)
  let listWidth = Math.ceil(getWidth(ReactDOM.findDOMNode(spec.listRef)))
  let trackWidth = Math.ceil(getWidth(ReactDOM.findDOMNode(spec.trackRef)))
  let slideWidth
  if (!spec.vertical) {
    let centerPaddingAdj = spec.centerMode && parseInt(spec.centerPadding) * 2
    if (typeof spec.centerPadding === 'string' &&
      spec.centerPadding.slice(-1) === '%') {
      centerPaddingAdj *= listWidth / 100
    }
    slideWidth = Math.ceil((listWidth - centerPaddingAdj) / spec.slidesToShow)
  } else {
    slideWidth = listWidth
  }
  let slideHeight = getHeight(
    ReactDOM.findDOMNode(spec.listRef).querySelector('[data-index="0"]')
  )
  let listHeight = slideHeight * spec.slidesToShow
  let currentSlide = spec.currentSlide || spec.initialSlide
  if (spec.rtl && !spec.currentSlide) {
    currentSlide = slideCount - 1 - spec.initialSlide
  }
  let lazyLoadedList = spec.lazyLoadedList || []
  let slidesToLoad = getOnDemandLazySlides({currentSlide, lazyLoadedList}, spec)
  lazyLoadedList.concat(slidesToLoad)
  
  return { slideCount, slideWidth, listWidth, trackWidth, currentSlide, 
  slideHeight, listHeight, lazyLoadedList }
}

export const changeSlideHelper = spec => {
  const {waitForAnimate, animating, fade, infinite, index, slideCount,
    lazyLoadedList, lazyLoad, onLazyLoad, asNavFor, currentSlide, speed,
    centerMode, slidesToScroll, slidesToShow, useCSS
  } = spec
  if (waitForAnimate && animating) return {}
  let animationSlide = index, finalSlide, animationLeft, finalLeft
  let state = {}, nextState = {}
  if (fade) {
    if (!infinite && (index < 0 || index >= slideCount)) return {}
    if (index < 0) {
      animationSlide = index + slideCount
    } else if (index >= slideCount) {
      animationSlide = index - slideCount
    }
    if (lazyLoad && lazyLoadedList.indexOf(animationSlide) < 0) {
      lazyLoadedList.push(animationSlide)
      //onLazyLoad && onLazyLoad(animationSlide)
    }
    state = {
      animating: true,
      currentSlide: animationSlide,
      lazyLoadedList
    }
    nextState = { animating: false }
  } else {
    finalSlide = animationSlide
    if (animationSlide < 0) {
      finalSlide = animationSlide + slideCount
      if (!inifinite) finalSlide = 0
      else if(slideCount % slidesToScroll !== 0)
        finalSlide = slideCount - slideCount % slidesToScroll
    } else if (centerMode && animationSlide >= slideCount) {
      animationSlide = infinite ? slideCount : slideCount - 1
      finalSlide = infinite ? 0 : slideCount - 1
    } else if (animationSlide >= slideCount) {
      finalSlide = animationSlide - slideCount
      if (!infinite) finalSlide = slideCount - slidesToShow
      else if(slideCount % slidesToScroll !== 0) finalSlide = 0
    } else if (currentSlide + slidesToShow < slideCount &&
      animationSlide + slidesToShow >= slideCount) {
      if (!infinite || (slideCount - animationSlide) % slidesToScroll !== 0)
        finalSlide = slideCount - slidesToShow
    }
    animationLeft = getTrackLeft({...spec, slideIndex: animationSlide})
    finalLeft = getTrackLeft({...spec, slideIndex: finalSlide})
    if (!infinite) {
      if(animationLeft === finalLeft) animationSlide = finalSlide
      animationLeft = finalLeft
    }
    lazyLoad && lazyLoadedList.concat(
      getOnDemandLazySlides({...spec, currentSlide: animationSlide}))
    if (!useCSS) {
      state = {
        currentSlide: finalSlide,
        trackStyle: getTrackCSS({...spec, left: finalLeft}),
        lazyLoadedList
      }
    } else {
      state = {
        animating: true,
        currentSlide: finalSlide,
        trackStyle: getTrackAnimateCSS({...spec, left: animationLeft}),
        lazyLoadedList
      }
      nextState = {
        animating: false,
        currentSlide: finalSlide,
        trackStyle: getTrackCSS({...spec, left: finalLeft}),
        swipeLeft: null
      }
    }
  }
  return {state, nextState}
}
