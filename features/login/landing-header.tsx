"use client";
import React from "react";

export function LandingHeader({ isHeaderActive, isNavActive, toggleNav, openLoginModal }: any) {
  return (
    <>
      {/* HEADER */}
      <header className={`header ${isHeaderActive ? "active" : ""}`} data-header>
        <div className="container">
          {/* LOGO: C box fused with text - fully centered via inline styles */}
          <a
            href="#"
            className="logo group no-underline shrink-0"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 0, whiteSpace: 'nowrap', textDecoration: 'none' }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                flexShrink: 0,
              }}
            >
              <img
                src="/image/right.png"
                alt="Course Q&A Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scale(1.35)',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '48px',
                padding: '0 14px 0 8px',
                fontWeight: 800,
                fontSize: '24px',
                color: '#0f172a',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              Course&nbsp;<span style={{ color: '#2563eb' }}>Q&amp;A</span>
            </div>
          </a>

          <nav className={`navbar ${isNavActive ? "active" : ""}`} data-navbar>
            <div className="wrapper">
                <a
                href="#"
                className="logo no-underline shrink-0"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 0, whiteSpace: 'nowrap', textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '28px',
                    borderRadius: '14px 0 0 14px',
                    flexShrink: 0,
                    lineHeight: 1,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  }}
                >
                  C
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '48px',
                    padding: '0 14px 0 4px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '0 14px 14px 0',
                    fontWeight: 800,
                    fontSize: '28px',
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.1)',
                  }}
                >
                  ourse&nbsp;<span style={{ color: '#2563eb' }}>Q&amp;A</span>
                </div>
              </a>

              <button
                className="nav-close-btn"
                aria-label="close menu"
                onClick={toggleNav}
              >
                <ion-icon name="close-outline" aria-hidden="true"></ion-icon>
              </button>
            </div>

            <ul className="navbar-list">
              <li className="navbar-item">
                <a href="#home" className="navbar-link" onClick={() => setIsNavActive(false)}>
                  Home
                </a>
              </li>
              <li className="navbar-item">
                <a href="#about" className="navbar-link" onClick={() => setIsNavActive(false)}>
                  About
                </a>
              </li>
              <li className="navbar-item">
                <a href="#courses" className="navbar-link" onClick={() => setIsNavActive(false)}>
                  Courses
                </a>
              </li>
              <li className="navbar-item">
                <a href="#blog" className="navbar-link" onClick={() => setIsNavActive(false)}>
                  Blog
                </a>
              </li>
              <li className="navbar-item">
                <a href="#contact" className="navbar-link" onClick={() => setIsNavActive(false)}>
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <div className="header-actions">
            <button className="header-action-btn" aria-label="toggle search" title="Search">
              <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
            </button>

            {/* REPLACED "Try for free" WITH "Log in" */}
            <button onClick={openLoginModal} className="btn has-before cursor-pointer">
              <span className="span">Log in</span>
              <ion-icon name="arrow-forward-outline" aria-hidden="true"></ion-icon>
            </button>

            <button
              className="header-action-btn"
              aria-label="open menu"
              onClick={toggleNav}
            >
              <ion-icon name="menu-outline" aria-hidden="true"></ion-icon>
            </button>
          </div>

          <div
            className={`overlay ${isNavActive ? "active" : ""}`}
            onClick={toggleNav}
          ></div>
        </div>
      </header>
    </>
  );
}
