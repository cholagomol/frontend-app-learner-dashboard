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
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const courseSearchUrl = learnerData?.platformSettings?.courseSearchUrl || '';
  const hyperlinkDestination = baseAppUrl(courseSearchUrl) || '';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const client = getAuthenticatedHttpClient();
        const response = await client.get(`${getConfig().LMS_BASE_URL}/api/courses/v1/courses/`);
        const allCourses = response?.data?.results || [];

        // Get enrolled course IDs
        const enrolledIds = new Set(
          (learnerData?.courses || []).map(c => c?.courseRun?.courseId || c?.id || c?.course_id)
        );

        // Filter out enrolled courses
        const filtered = allCourses.filter(
          course => !enrolledIds.has(course.id) && !enrolledIds.has(course.course_id)
        );

        setRecommendedCourses(filtered);
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
          <span className="text-muted small">กำลังโหลดคอร์สแนะนำ...</span>
        </Card.Body>
      </Card>
    );
  }

  if (recommendedCourses.length === 0) {
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

  return (
    <div id="recommended-courses-widget" className="w-100">
      <h3 className="h5 mb-3 font-weight-bold" style={{ color: '#1a2530' }}>
        คอร์สแนะนำสำหรับคุณ
      </h3>
      <div className="d-flex flex-column">
        {recommendedCourses.map(course => {
          const courseId = course.id || course.course_id;
          const detailsUrl = baseAppUrl(`/courses/${courseId}/about`);
          const imgUrl = course.media?.course_image?.uri 
            ? baseAppUrl(course.media.course_image.uri)
            : moreCoursesSVG;

          return (
            <Card key={courseId} className="recommended-course-card shadow-sm border-light mb-3">
              <div className="d-flex flex-column">
                <div style={{ position: 'relative', width: '100%', height: '110px', overflow: 'hidden' }}>
                  <img 
                    src={imgUrl} 
                    alt={course.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="badge badge-primary" style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.7rem', padding: '4px 8px', backgroundColor: '#3b82f6' }}>
                    {course.org}
                  </div>
                </div>
                <Card.Body className="p-3">
                  <h4 className="card-title h6 mb-1 text-truncate" title={course.name} style={{ fontWeight: 600 }}>
                    {course.name}
                  </h4>
                  <p className="card-text small text-muted mb-3">
                    รหัสวิชา: {course.number}
                  </p>
                  <Button
                    variant="brand"
                    as="a"
                    href={detailsUrl}
                    size="sm"
                    className="w-100 d-flex justify-content-center align-items-center"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    ดูรายละเอียดคอร์ส {arrowIcon}
                  </Button>
                </Card.Body>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="text-center mt-2">
        <Hyperlink
          variant="muted"
          destination={hyperlinkDestination}
          className="small d-inline-flex align-items-center"
          style={{ textDecoration: 'underline' }}
        >
          ดูคอร์สทั้งหมดเพิ่มเติม {arrowIcon}
        </Hyperlink>
      </div>
    </div>
  );
};

LookingForChallengeWidget.propTypes = {};

export default LookingForChallengeWidget;
