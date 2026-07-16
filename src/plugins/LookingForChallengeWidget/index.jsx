import React, { useState, useEffect } from 'react';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Card, Hyperlink, Icon, Button } from '@openedx/paragon';
import { ArrowForward } from '@openedx/paragon/icons';

import { useInitializeLearnerHome } from 'data/hooks';
import moreCoursesSVG from 'assets/more-courses-sidewidget.svg';
import { baseAppUrl } from 'data/services/lms/urls';

import { findCoursesWidgetClicked } from './track';
import messages from './messages';
import './index.scss';

export const arrowIcon = (<Icon className="mx-1" src={ArrowForward} />);

export const LookingForChallengeWidget = () => {
  const { formatMessage } = useIntl();
  const { data: learnerData } = useInitializeLearnerHome();
  const [latestCourse, setLatestCourse] = useState(null);
  const [recommendedCourse, setRecommendedCourse] = useState(null);
  const [sourceEnrolledCourse, setSourceEnrolledCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const courseSearchUrl = learnerData?.platformSettings?.courseSearchUrl || '';
  const hyperlinkDestination = baseAppUrl(courseSearchUrl) || '';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const client = getAuthenticatedHttpClient();
        const response = await client.get(`${getConfig().LMS_BASE_URL}/api/courses/v1/courses/`);
        const allCourses = response?.data?.results || [];

        // 1. Get enrolled course IDs and categories
        const enrolledCourses = learnerData?.courses || [];
        const enrolledIds = new Set();

        enrolledCourses.forEach(c => {
          const enrolledId = c?.courseRun?.courseId || c?.id || c?.course_id || c?.course?.id;
          if (enrolledId) enrolledIds.add(enrolledId);
        });

        // 2. Filter catalog to non-enrolled courses
        const nonEnrolled = allCourses.filter(
          course => !enrolledIds.has(course.id) && !enrolledIds.has(course.course_id)
        );

        // 3. Find SLOT 1: Latest Course
        let latest = null;
        if (nonEnrolled.length > 0) {
          const sortedByDate = [...nonEnrolled].sort((a, b) => {
            const dateA = a.start ? new Date(a.start).getTime() : 0;
            const dateB = b.start ? new Date(b.start).getTime() : 0;
            return dateB - dateA;
          });
          latest = sortedByDate[0];
          setLatestCourse(latest);
        }

        // 4. Find SLOT 2: Category Match Recommendation
        let recommended = null;
        let sourceEnrolled = null;

        for (const enrolled of enrolledCourses) {
          const courseNum = enrolled?.course?.number || enrolled?.number || enrolled?.courseRun?.number;
          if (!courseNum) continue;

          const match = String(courseNum).match(/^[a-zA-Z]+/);
          if (!match) continue;

          const enrolledCat = match[0].toLowerCase();

          // Find a matching course that is not enrolled and not the latest course
          const categoryMatches = nonEnrolled.filter(course => {
            if (latest && (course.id === latest.id || course.course_id === latest.course_id)) {
              return false;
            }
            const cMatch = String(course.number || '').match(/^[a-zA-Z]+/);
            const cCat = cMatch ? cMatch[0].toLowerCase() : '';
            return cCat === enrolledCat;
          });

          if (categoryMatches.length > 0) {
            sourceEnrolled = enrolled;
            recommended = categoryMatches[Math.floor(Math.random() * categoryMatches.length)];
            break;
          }
        }

        // Fallback for Slot 2 if no category match is found
        if (!recommended && nonEnrolled.length > 0) {
          const remaining = nonEnrolled.filter(course => {
            if (latest && (course.id === latest.id || course.course_id === latest.course_id)) {
              return false;
            }
            return true;
          });
          if (remaining.length > 0) {
            recommended = remaining[Math.floor(Math.random() * remaining.length)];
          }
        }

        setRecommendedCourse(recommended);
        setSourceEnrolledCourse(sourceEnrolled);
      } catch (err) {
        console.error('Failed to fetch recommended courses:', err);
      } finally {
        setLoading(false);
      }
    };

    if (learnerData) {
      fetchCourses();
    }
  }, [learnerData]);

  if (loading) {
    return (
      <Card id="looking-for-challenge-widget" className="p-3 text-center border-light shadow-sm">
        <Card.Body>
          <div className="spinner-border spinner-border-sm text-primary mr-2" role="status" />
          <span className="text-muted small">Loading recommended courses...</span>
        </Card.Body>
      </Card>
    );
  }

  // If there are no courses at all to recommend, show default fallback widget
  if (!latestCourse && !recommendedCourse) {
    return (
      <Card orientation="horizontal" id="looking-for-challenge-widget">
        <Card.ImageCap
          src={moreCoursesSVG}
          srcAlt="course side widget"
        />
        <Card.Body className="m-auto pr-2">
          <h4>
            {formatMessage(messages.lookingForChallengePrompt)}
          </h4>
          <h5>
            <Hyperlink
              variant="brand"
              destination={hyperlinkDestination}
              onClick={findCoursesWidgetClicked(hyperlinkDestination)}
              className="d-flex align-items-center"
            >
              {formatMessage(messages.findCoursesButton, { arrow: arrowIcon })}
            </Hyperlink>
          </h5>
        </Card.Body>
      </Card>
    );
  }

  const renderCourseCard = (course) => {
    const courseId = course.id || course.course_id;
    const detailsUrl = baseAppUrl(`/courses/${courseId}/about`);
    const imgUrl = course.media?.course_image?.uri 
      ? baseAppUrl(course.media.course_image.uri)
      : moreCoursesSVG;

    return (
      <Card key={courseId} className="recommended-course-card shadow-sm border-light mb-3" style={{ position: 'relative' }}>
        <Card.ImageCap 
          src={imgUrl} 
          srcAlt={course.name} 
          style={{ width: '100%', height: '140px', objectFit: 'contain', backgroundColor: '#f8fafc', display: 'block' }}
        />
        <div className="badge badge-primary" style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.75rem', padding: '4px 8px', backgroundColor: '#3b82f6', zIndex: 10 }}>
          {course.org}
        </div>
        <Card.Body className="p-3">
            <h4 className="card-title h5 mb-1 text-truncate" title={course.name} style={{ fontWeight: 'bold' }}>
              {course.name}
            </h4>
            <p className="card-text text-muted mb-3" style={{ fontSize: '0.9rem' }}>
              Course Code: {course.number}
            </p>
            <Button
              variant="brand"
              as="a"
              href={detailsUrl}
              size="sm"
              className="w-100 d-flex justify-content-center align-items-center"
              style={{ fontSize: '0.9rem', padding: '8px 12px' }}
            >
              View Details {arrowIcon}
            </Button>
          </Card.Body>
      </Card>
    );
  };

  return (
    <div id="recommended-courses-widget" className="w-100">
      
      {/* SLOT 1: Latest Course */}
      {latestCourse && (
        <div className="mb-4">
          <h3 className="h4 mb-2 font-weight-bold d-flex align-items-center" style={{ color: '#0f172a' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', marginRight: '8px' }} />
            New Course
          </h3>
          {renderCourseCard(latestCourse)}
        </div>
      )}

      {/* SLOT 2: Category Match Recommendation */}
      {recommendedCourse && (
        <div className="mb-3">
          <h3 className="h4 mb-2 font-weight-bold" style={{ color: '#0f172a', lineHeight: '1.4' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', marginRight: '8px' }} />
            {sourceEnrolledCourse ? (
              <>Since you are enrolled in <span style={{ color: '#3b82f6' }}>"{sourceEnrolledCourse.course?.courseName || sourceEnrolledCourse.name}"</span>, would you be interested in this course?</>
            ) : (
              <>Recommended for you</>
            )}
          </h3>
          {renderCourseCard(recommendedCourse)}
        </div>
      )}

      <div className="text-center mt-3">
        <Hyperlink
          variant="muted"
          destination={hyperlinkDestination}
          className="d-inline-flex align-items-center"
          style={{ textDecoration: 'underline', fontSize: '0.95rem' }}
        >
          View all courses {arrowIcon}
        </Hyperlink>
      </div>
    </div>
  );
};

LookingForChallengeWidget.propTypes = {};

export default LookingForChallengeWidget;
