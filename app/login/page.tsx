"use client";
import './education-template.css';
import React, { useState, useEffect } from "react";
import { LandingHeader } from "@/features/login/landing-header";
import { LandingFooter } from "@/features/login/landing-footer";
import { LoginModal } from "@/features/login/login-modal";

export default function Home() {
  const [isNavActive, setIsNavActive] = useState(false);
  const [isHeaderActive, setIsHeaderActive] = useState(false);
  const [isBackTopActive, setIsBackTopActive] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY >= 100) {
        setIsHeaderActive(true);
        setIsBackTopActive(true);
      } else {
        setIsHeaderActive(false);
        setIsBackTopActive(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleNav = () => setIsNavActive(!isNavActive);
  const openLoginModal = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsLoginModalOpen(true);
    setIsNavActive(false);
  };
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <>
      <LandingHeader 
        isHeaderActive={isHeaderActive} 
        isNavActive={isNavActive} 
        toggleNav={toggleNav} 
        openLoginModal={openLoginModal} 
      />
      
      {/* MAIN CONTENT */}
      <main>
        <article>
          {/* HERO */}
          <section
            className="section hero has-bg-image"
            id="home"
            aria-label="home"
            style={{ backgroundImage: "url('/image/hero-bg.svg')" }}
          >
            <div className="container">
              <div className="hero-content">
                <h1 className="h1 section-title">
                  The Best Program to <span className="span">Enroll</span> for Exchange
                </h1>

                <p className="hero-text">
                  Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit.
                </p>

                <a href="#courses" className="btn has-before">
                  <span className="span">Find courses</span>
                  <ion-icon name="arrow-forward-outline" aria-hidden="true"></ion-icon>
                </a>
              </div>

              <figure className="hero-banner">
                <div className="img-holder one" style={{ "--width": 270, "--height": 300 } as React.CSSProperties}>
                  <img
                    src="/image/hero-banner-1.jpg"
                    width="270"
                    height="300"
                    alt="hero banner"
                    className="img-cover"
                  />
                </div>

                <div className="img-holder two" style={{ "--width": 240, "--height": 370 } as React.CSSProperties}>
                  <img
                    src="/image/hero-banner-2.jpg"
                    width="240"
                    height="370"
                    alt="hero banner"
                    className="img-cover"
                  />
                </div>

                <img
                  src="/image/hero-shape-1.svg"
                  width="380"
                  height="190"
                  alt=""
                  className="shape hero-shape-1"
                />

                <img
                  src="/image/hero-shape-2.png"
                  width="622"
                  height="551"
                  alt=""
                  className="shape hero-shape-2"
                />
              </figure>
            </div>
          </section>

          {/* CATEGORY */}
          <section className="section category" aria-label="category">
            <div className="container">
              <p className="section-subtitle">Categories</p>

              <h2 className="h2 section-title">
                Online <span className="span">Classes</span> For Remote Learning.
              </h2>

              <p className="section-text">
                Consectetur adipiscing elit sed do eiusmod tempor.
              </p>

              <ul className="grid-list">
                <li>
                  <div className="category-card" style={{ "--color": "170, 75%, 41%" } as React.CSSProperties}>
                    <div className="card-icon">
                      <img
                        src="/image/category-1.svg"
                        width="40"
                        height="40"
                        loading="lazy"
                        alt="Online Degree Programs"
                        className="img"
                      />
                    </div>
                    <h3 className="h3">
                      <a href="#courses" className="card-title">Online Degree Programs</a>
                    </h3>
                    <p className="card-text">
                      Lorem ipsum dolor consec tur elit adicing sed umod tempor.
                    </p>
                    <span className="card-badge">7 Courses</span>
                  </div>
                </li>

                <li>
                  <div className="category-card" style={{ "--color": "351, 83%, 61%" } as React.CSSProperties}>
                    <div className="card-icon">
                      <img
                        src="/image/category-2.svg"
                        width="40"
                        height="40"
                        loading="lazy"
                        alt="Non-Degree Programs"
                        className="img"
                      />
                    </div>
                    <h3 className="h3">
                      <a href="#courses" className="card-title">Non-Degree Programs</a>
                    </h3>
                    <p className="card-text">
                      Lorem ipsum dolor consec tur elit adicing sed umod tempor.
                    </p>
                    <span className="card-badge">4 Courses</span>
                  </div>
                </li>

                <li>
                  <div className="category-card" style={{ "--color": "229, 75%, 58%" } as React.CSSProperties}>
                    <div className="card-icon">
                      <img
                        src="/image/category-3.svg"
                        width="40"
                        height="40"
                        loading="lazy"
                        alt="Off-Campus Programs"
                        className="img"
                      />
                    </div>
                    <h3 className="h3">
                      <a href="#courses" className="card-title">Off-Campus Programs</a>
                    </h3>
                    <p className="card-text">
                      Lorem ipsum dolor consec tur elit adicing sed umod tempor.
                    </p>
                    <span className="card-badge">8 Courses</span>
                  </div>
                </li>

                <li>
                  <div className="category-card" style={{ "--color": "42, 94%, 55%" } as React.CSSProperties}>
                    <div className="card-icon">
                      <img
                        src="/image/category-4.svg"
                        width="40"
                        height="40"
                        loading="lazy"
                        alt="Hybrid Distance Programs"
                        className="img"
                      />
                    </div>
                    <h3 className="h3">
                      <a href="#courses" className="card-title">Hybrid Distance Programs</a>
                    </h3>
                    <p className="card-text">
                      Lorem ipsum dolor consec tur elit adicing sed umod tempor.
                    </p>
                    <span className="card-badge">8 Courses</span>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* ABOUT */}
          <section className="section about" id="about" aria-label="about">
            <div className="container">
              <figure className="about-banner">
                <div className="img-holder" style={{ "--width": 520, "--height": 370 } as React.CSSProperties}>
                  <img
                    src="/image/about-banner.jpg"
                    width="520"
                    height="370"
                    loading="lazy"
                    alt="about banner"
                    className="img-cover"
                  />
                </div>

                <img
                  src="/image/about-shape-1.svg"
                  width="360"
                  height="420"
                  loading="lazy"
                  alt=""
                  className="shape about-shape-1"
                />

                <img
                  src="/image/about-shape-2.svg"
                  width="371"
                  height="220"
                  loading="lazy"
                  alt=""
                  className="shape about-shape-2"
                />

                <img
                  src="/image/about-shape-3.png"
                  width="722"
                  height="528"
                  loading="lazy"
                  alt=""
                  className="shape about-shape-3"
                />
              </figure>

              <div className="about-content">
                <p className="section-subtitle">About Us</p>

                <h2 className="h2 section-title">
                  Over 10 Years in <span className="span">Distant learning</span> for Skill Development
                </h2>

                <p className="section-text">
                  Lorem ipsum dolor sit amet consectur adipiscing elit sed eiusmod ex tempor incididunt labore dolore magna
                  aliquaenim ad minim.
                </p>

                <ul className="about-list">
                  <li className="about-item">
                    <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>
                    <span className="span">Expert Trainers</span>
                  </li>

                  <li className="about-item">
                    <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>
                    <span className="span">Online Remote Learning</span>
                  </li>

                  <li className="about-item">
                    <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>
                    <span className="span">Lifetime Access</span>
                  </li>
                </ul>

                <img
                  src="/image/about-shape-4.svg"
                  width="100"
                  height="100"
                  loading="lazy"
                  alt=""
                  className="shape about-shape-4"
                />
              </div>
            </div>
          </section>

          {/* COURSES */}
          <section className="section course" id="courses" aria-label="course">
            <div className="container">
              <p className="section-subtitle">Popular Courses</p>
              <h2 className="h2 section-title">Pick A Course To Get Started</h2>

              <ul className="grid-list">
                <li>
                  <div className="course-card">
                    <figure className="card-banner img-holder" style={{ "--width": 370, "--height": 220 } as React.CSSProperties}>
                      <img
                        src="/image/course-1.jpg"
                        width="370"
                        height="220"
                        loading="lazy"
                        alt="Build Responsive Real- World Websites with HTML and CSS"
                        className="img-cover"
                      />
                    </figure>

                    <div className="abs-badge">
                      <ion-icon name="time-outline" aria-hidden="true"></ion-icon>
                      <span className="span">3 Weeks</span>
                    </div>

                    <div className="card-content">
                      <span className="badge">Beginner</span>
                      <h3 className="h3">
                        <a href="#" className="card-title">
                          Build Responsive Real- World Websites with HTML and CSS
                        </a>
                      </h3>

                      <div className="wrapper">
                        <div className="rating-wrapper">
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                        </div>
                        <p className="rating-text">(5.0/7 Rating)</p>
                      </div>

                      <data className="price" value="29">$29.00</data>

                      <ul className="card-meta-list">
                        <li className="card-meta-item">
                          <ion-icon name="library-outline" aria-hidden="true"></ion-icon>
                          <span className="span">8 Lessons</span>
                        </li>
                        <li className="card-meta-item">
                          <ion-icon name="people-outline" aria-hidden="true"></ion-icon>
                          <span className="span">20 Students</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li>
                  <div className="course-card">
                    <figure className="card-banner img-holder" style={{ "--width": 370, "--height": 220 } as React.CSSProperties}>
                      <img
                        src="/image/course-2.jpg"
                        width="370"
                        height="220"
                        loading="lazy"
                        alt="Java Programming Masterclass for Software Developers"
                        className="img-cover"
                      />
                    </figure>

                    <div className="abs-badge">
                      <ion-icon name="time-outline" aria-hidden="true"></ion-icon>
                      <span className="span">8 Weeks</span>
                    </div>

                    <div className="card-content">
                      <span className="badge">Advanced</span>
                      <h3 className="h3">
                        <a href="#" className="card-title">
                          Java Programming Masterclass for Software Developers
                        </a>
                      </h3>

                      <div className="wrapper">
                        <div className="rating-wrapper">
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                        </div>
                        <p className="rating-text">(4.5 /9 Rating)</p>
                      </div>

                      <data className="price" value="49">$49.00</data>

                      <ul className="card-meta-list">
                        <li className="card-meta-item">
                          <ion-icon name="library-outline" aria-hidden="true"></ion-icon>
                          <span className="span">15 Lessons</span>
                        </li>
                        <li className="card-meta-item">
                          <ion-icon name="people-outline" aria-hidden="true"></ion-icon>
                          <span className="span">35 Students</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>

                <li>
                  <div className="course-card">
                    <figure className="card-banner img-holder" style={{ "--width": 370, "--height": 220 } as React.CSSProperties}>
                      <img
                        src="/image/course-3.jpg"
                        width="370"
                        height="220"
                        loading="lazy"
                        alt="The Complete Camtasia Course for Content Creators"
                        className="img-cover"
                      />
                    </figure>

                    <div className="abs-badge">
                      <ion-icon name="time-outline" aria-hidden="true"></ion-icon>
                      <span className="span">3 Weeks</span>
                    </div>

                    <div className="card-content">
                      <span className="badge">Intermediate</span>
                      <h3 className="h3">
                        <a href="#" className="card-title">
                          The Complete Camtasia Course for Content Creators
                        </a>
                      </h3>

                      <div className="wrapper">
                        <div className="rating-wrapper">
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                          <ion-icon name="star"></ion-icon>
                        </div>
                        <p className="rating-text">(4.9 /7 Rating)</p>
                      </div>

                      <data className="price" value="35">$35.00</data>

                      <ul className="card-meta-list">
                        <li className="card-meta-item">
                          <ion-icon name="library-outline" aria-hidden="true"></ion-icon>
                          <span className="span">13 Lessons</span>
                        </li>
                        <li className="card-meta-item">
                          <ion-icon name="people-outline" aria-hidden="true"></ion-icon>
                          <span className="span">18 Students</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
              </ul>

              <a href="#" className="btn has-before">
                <span className="span">Browse more courses</span>
                <ion-icon name="arrow-forward-outline" aria-hidden="true"></ion-icon>
              </a>
            </div>
          </section>

          {/* VIDEOS */}
          <section
            className="video has-bg-image"
            aria-label="video"
            style={{ backgroundImage: "url('/image/video-bg.png')" }}
          >
            <div className="container">
              <div className="video-card">
                <div className="video-banner img-holder has-after">
                  <img
                    src="/image/video-banner.jpg"
                    width="970"
                    height="550"
                    loading="lazy"
                    alt="video banner"
                    className="img-cover"
                  />

                  <button className="play-btn" aria-label="play video" onClick={openLoginModal}>
                    <ion-icon name="play" aria-hidden="true"></ion-icon>
                  </button>
                </div>

                <img
                  src="/image/video-shape-1.png"
                  width="1089"
                  height="605"
                  loading="lazy"
                  alt=""
                  className="shape video-shape-1"
                />

                <img
                  src="/image/video-shape-2.png"
                  width="158"
                  height="174"
                  loading="lazy"
                  alt=""
                  className="shape video-shape-2"
                />
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="section stats" aria-label="stats">
            <div className="container">
              <ul className="grid-list">
                <li>
                  <div className="stats-card" style={{ "--color": "170, 75%, 41%" } as React.CSSProperties}>
                    <h3 className="card-title">29.3k</h3>
                    <p className="card-text">Student Enrolled</p>
                  </div>
                </li>

                <li>
                  <div className="stats-card" style={{ "--color": "351, 83%, 61%" } as React.CSSProperties}>
                    <h3 className="card-title">32.4K</h3>
                    <p className="card-text">Class Completed</p>
                  </div>
                </li>

                <li>
                  <div className="stats-card" style={{ "--color": "260, 100%, 67%" } as React.CSSProperties}>
                    <h3 className="card-title">100%</h3>
                    <p className="card-text">Satisfaction Rate</p>
                  </div>
                </li>

                <li>
                  <div className="stats-card" style={{ "--color": "42, 94%, 55%" } as React.CSSProperties}>
                    <h3 className="card-title">354+</h3>
                    <p className="card-text">Top Instructors</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* BLOGS */}
          <section
            className="section blog has-bg-image"
            id="blog"
            aria-label="blog"
            style={{ backgroundImage: "url('/image/blog-bg.svg')" }}
          >
            <div className="container">
              <p className="section-subtitle">Latest Articles</p>

              <h2 className="h2 section-title">Get News With Eduweb</h2>

              <ul className="grid-list">
                <li>
                  <div className="blog-card">
                    <figure className="card-banner img-holder has-after" style={{ "--width": 370, "--height": 370 } as React.CSSProperties}>
                      <img
                        src="/image/blog-1.jpg"
                        width="370"
                        height="370"
                        loading="lazy"
                        alt="Become A Better Blogger: Content Planning"
                        className="img-cover"
                      />
                    </figure>

                    <div className="card-content">
                      <a href="#" className="card-btn" aria-label="read more">
                        <ion-icon name="arrow-forward-outline" aria-hidden="true"></ion-icon>
                      </a>

                      <a href="#" className="card-subtitle">Online</a>

                      <h3 className="h3">
                        <a href="#" className="card-title">
                          Become A Better Blogger: Content Planning
                        </a>
                      </h3>

                      <ul className="card-meta-list">
                        <li className="card-meta-item">
                          <ion-icon name="calendar-outline" aria-hidden="true"></ion-icon>
                          <span className="span">Oct 10, 2021</span>
                        </li>
                        <li className="card-meta-item">
                          <ion-icon name="chatbubbles-outline" aria-hidden="true"></ion-icon>
                          <span className="span">Com 09</span>
                        </li>
                      </ul>

                      <p className="card-text">
                        Lorem Ipsum Dolor Sit Amet Cons Tetur Adipisicing Sed.
                      </p>
                    </div>
                  </div>
                </li>

                <li>
                  <div className="blog-card">
                    <figure className="card-banner img-holder has-after" style={{ "--width": 370, "--height": 370 } as React.CSSProperties}>
                      <img
                        src="/image/blog-2.jpg"
                        width="370"
                        height="370"
                        loading="lazy"
                        alt="Become A Better Blogger: Content Planning"
                        className="img-cover"
                      />
                    </figure>

                    <div className="card-content">
                      <a href="#" className="card-btn" aria-label="read more">
                        <ion-icon name="arrow-forward-outline" aria-hidden="true"></ion-icon>
                      </a>

                      <a href="#" className="card-subtitle">Online</a>

                      <h3 className="h3">
                        <a href="#" className="card-title">
                          Become A Better Blogger: Content Planning
                        </a>
                      </h3>

                      <ul className="card-meta-list">
                        <li className="card-meta-item">
                          <ion-icon name="calendar-outline" aria-hidden="true"></ion-icon>
                          <span className="span">Oct 10, 2021</span>
                        </li>
                        <li className="card-meta-item">
                          <ion-icon name="chatbubbles-outline" aria-hidden="true"></ion-icon>
                          <span className="span">Com 09</span>
                        </li>
                      </ul>

                      <p className="card-text">
                        Lorem Ipsum Dolor Sit Amet Cons Tetur Adipisicing Sed.
                      </p>
                    </div>
                  </div>
                </li>

                <li>
                  <div className="blog-card">
                    <figure className="card-banner img-holder has-after" style={{ "--width": 370, "--height": 370 } as React.CSSProperties}>
                      <img
                        src="/image/blog-3.jpg"
                        width="370"
                        height="370"
                        loading="lazy"
                        alt="Become A Better Blogger: Content Planning"
                        className="img-cover"
                      />
                    </figure>

                    <div className="card-content">
                      <a href="#" className="card-btn" aria-label="read more">
                        <ion-icon name="arrow-forward-outline" aria-hidden="true"></ion-icon>
                      </a>

                      <a href="#" className="card-subtitle">Online</a>

                      <h3 className="h3">
                        <a href="#" className="card-title">
                          Become A Better Blogger: Content Planning
                        </a>
                      </h3>

                      <ul className="card-meta-list">
                        <li className="card-meta-item">
                          <ion-icon name="calendar-outline" aria-hidden="true"></ion-icon>
                          <span className="span">Oct 10, 2021</span>
                        </li>
                        <li className="card-meta-item">
                          <ion-icon name="chatbubbles-outline" aria-hidden="true"></ion-icon>
                          <span className="span">Com 09</span>
                        </li>
                      </ul>

                      <p className="card-text">
                        Lorem Ipsum Dolor Sit Amet Cons Tetur Adipisicing Sed.
                      </p>
                    </div>
                  </div>
                </li>
              </ul>

              <img
                src="/image/blog-shape.png"
                width="186"
                height="186"
                loading="lazy"
                alt=""
                className="shape blog-shape"
              />
            </div>
          </section>
        </article>
      </main>
      
      <LandingFooter />
      
      {/* GO TO TOP */}
      <a
        href="#top"
        className={`back-top-btn ${isBackTopActive ? "active" : ""}`}
        aria-label="back to top"
        data-back-top-btn
      >
        <ion-icon name="chevron-up" aria-hidden="true"></ion-icon>
      </a>
      
      <LoginModal 
        isLoginModalOpen={isLoginModalOpen} 
        closeLoginModal={closeLoginModal} 
      />
    </>
  );
}
